import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, AuthSession } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'node:crypto';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuthConfig } from './auth.config';
import { SigninDto, SignupDto } from './dto/auth.dto';
import { tokenHash } from './oauth-state.store';
import { Tokens } from './types';

type SessionWithUser = AuthSession & { user: { id: number; email: string } };
export interface SessionTokens {
  access: Tokens;
  refreshToken: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly dummyHash = bcrypt.hash(randomBytes(32).toString('hex'), 12);
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AuthConfig,
  ) {}

  private async findEmail(
    email: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    // Preserve historical case-sensitive addresses; never merge ambiguous users.
    const exact = await db.user.findUnique({ where: { email } });
    if (exact) return exact;
    const matches = await db.user.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      take: 2,
    });
    if (matches.length > 1)
      throw new UnauthorizedException(
        'Unable to sign in with these credentials',
      );
    return matches[0] ?? null;
  }

  async signup(dto: SignupDto, userAgent?: string): Promise<SessionTokens> {
    const email = dto.email.trim().toLowerCase();
    if (Buffer.byteLength(dto.password, 'utf8') > 72)
      throw new BadRequestException('Password must be at most 72 UTF-8 bytes');
    if (await this.findEmail(email))
      throw new ConflictException(
        'Unable to create an account with this email',
      );
    const hash = await bcrypt.hash(dto.password, 12);
    try {
      const result = await this.prisma.$transaction(async (db) => {
        const user = await db.user.create({ data: { email, hash } });
        return this.insertSession(db, user.id, userAgent);
      });
      return await this.issue(result.session, result.token);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'Unable to create an account with this email',
        );
      throw error;
    }
  }

  async signin(dto: SigninDto, userAgent?: string): Promise<SessionTokens> {
    const user = await this.findEmail(dto.email.trim());
    const valid = await bcrypt.compare(
      dto.password,
      user?.hash ?? (await this.dummyHash),
    );
    if (!user || !valid)
      throw new UnauthorizedException('Invalid email or password');
    return this.createSession(user.id, userAgent);
  }

  private async insertSession(
    db: Prisma.TransactionClient,
    userId: number,
    userAgent?: string,
  ) {
    const token = randomBytes(32).toString('base64url');
    const session = await db.authSession.create({
      data: {
        userId,
        userAgent: userAgent?.slice(0, 200),
        expiresAt: new Date(Date.now() + this.config.sessionMilliseconds),
        refreshTokens: { create: { hash: tokenHash(token) } },
      },
      include: { user: { select: { id: true, email: true } } },
    });
    return { session, token };
  }

  private async issue(
    session: SessionWithUser,
    refreshToken: string,
  ): Promise<SessionTokens> {
    const accessToken = await this.jwt.signAsync(
      {
        sub: session.userId,
        email: session.user.email,
        sid: session.id,
        type: 'access',
        jti: randomUUID(),
      },
      {
        secret: this.config.accessSecret,
        algorithm: 'HS256',
        expiresIn: this.config.accessSeconds,
        issuer: this.config.issuer,
        audience: this.config.audience,
      },
    );
    return {
      access: {
        access_token: accessToken,
        expires_in: this.config.accessSeconds,
      },
      refreshToken,
      expiresAt: session.expiresAt,
    };
  }

  private async createSession(
    userId: number,
    userAgent?: string,
  ): Promise<SessionTokens> {
    const result = await this.prisma.$transaction((db) =>
      this.insertSession(db, userId, userAgent),
    );
    return this.issue(result.session, result.token);
  }

  async refresh(token?: string): Promise<SessionTokens> {
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new UnauthorizedException('Invalid session');
    const result = await this.prisma.$transaction(async (db) => {
      const previous = await db.refreshToken.findUnique({
        where: { hash: tokenHash(token) },
        include: {
          session: { include: { user: { select: { id: true, email: true } } } },
        },
      });
      if (!previous) return null;
      const now = new Date();
      if (previous.consumedAt) {
        await db.authSession.updateMany({
          where: { id: previous.sessionId, revokedAt: null },
          data: { revokedAt: now },
        });
        return null;
      }
      // Lock the session before claiming the token. Logout and concurrent refreshes
      // serialize on this row; only a single use of each refresh token can win.
      const active = await db.authSession.updateMany({
        where: {
          id: previous.sessionId,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { lastUsedAt: now },
      });
      if (active.count !== 1) return null;
      const claimed = await db.refreshToken.updateMany({
        where: { hash: previous.hash, consumedAt: null },
        data: { consumedAt: now },
      });
      if (claimed.count !== 1) {
        await db.authSession.update({
          where: { id: previous.sessionId },
          data: { revokedAt: now },
        });
        return null;
      }
      const next = randomBytes(32).toString('base64url');
      await db.refreshToken.create({
        data: { hash: tokenHash(next), sessionId: previous.sessionId },
      });
      return { session: previous.session, token: next };
    });
    // Throw after committing a replay revocation, never roll it back.
    if (!result) throw new UnauthorizedException('Invalid session');
    return this.issue(result.session, result.token);
  }

  async authenticate(payload: {
    sub?: unknown;
    sid?: unknown;
    type?: unknown;
  }) {
    if (
      !Number.isInteger(payload.sub) ||
      typeof payload.sub !== 'number' ||
      payload.sub <= 0 ||
      typeof payload.sid !== 'string' ||
      !isUUID(payload.sid) ||
      payload.type !== 'access'
    )
      throw new UnauthorizedException('Invalid access token');
    const session = await this.prisma.authSession.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: { select: { email: true } } },
    });
    if (!session) throw new UnauthorizedException('Session expired or revoked');
    return { sub: session.userId, email: session.user.email, sid: session.id };
  }

  async logout(token?: string): Promise<void> {
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
    const record = await this.prisma.refreshToken.findUnique({
      where: { hash: tokenHash(token) },
      select: { sessionId: true },
    });
    if (record)
      await this.prisma.authSession.updateMany({
        where: { id: record.sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
  }

  async sessions(userId: number, currentId: string) {
    const sessions = await this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        userAgent: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((session) => ({
      ...session,
      current: session.id === currentId,
    }));
  }

  async revoke(userId: number, sessionId?: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        userId,
        ...(sessionId ? { id: sessionId } : {}),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async googleUser(
    subject: string,
    email: string,
  ): Promise<{ userId: number; linkSubject?: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { googleSubject: subject },
    });
    if (existing) return { userId: existing.id };
    const user = await this.findEmail(email);
    if (user) {
      if (user.googleSubject && user.googleSubject !== subject)
        throw new UnauthorizedException(
          'This account has a different Google identity',
        );
      // A legacy email alone cannot prove ownership of its unverified password account.
      return { userId: user.id, linkSubject: subject };
    }
    const hash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
    try {
      const created = await this.prisma.user.create({
        data: { email: email.toLowerCase(), hash, googleSubject: subject },
      });
      return { userId: created.id };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const linked = await this.prisma.user.findUnique({
          where: { googleSubject: subject },
        });
        if (linked) return { userId: linked.id };
        const concurrent = await this.findEmail(email);
        if (concurrent && !concurrent.googleSubject)
          return { userId: concurrent.id, linkSubject: subject };
        throw new UnauthorizedException('Unable to link this Google account');
      }
      throw error;
    }
  }

  async googleGrant(userId: number, googleSubject?: string): Promise<string> {
    const code = randomBytes(32).toString('base64url');
    await this.prisma.oAuthGrant.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    await this.prisma.oAuthGrant.create({
      data: {
        hash: tokenHash(code),
        userId,
        googleSubject,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    return code;
  }

  async exchangeGoogle(
    code: string,
    password?: string,
    userAgent?: string,
  ): Promise<SessionTokens> {
    const result = await this.prisma.$transaction(async (db) => {
      const grant = await db.oAuthGrant.findUnique({
        where: { hash: tokenHash(code) },
      });
      if (!grant || grant.expiresAt <= new Date()) return null;
      if (grant.googleSubject) {
        const user = await db.user.findUnique({ where: { id: grant.userId } });
        if (!user || !password || !(await bcrypt.compare(password, user.hash)))
          throw new ConflictException(
            'Enter your existing account password to link Google',
          );
      }
      const claimed = await db.oAuthGrant.deleteMany({
        where: { hash: grant.hash, expiresAt: { gt: new Date() } },
      });
      if (claimed.count !== 1) return null;
      if (grant.googleSubject) {
        const linked = await db.user.updateMany({
          where: {
            id: grant.userId,
            OR: [
              { googleSubject: null },
              { googleSubject: grant.googleSubject },
            ],
          },
          data: { googleSubject: grant.googleSubject },
        });
        if (linked.count !== 1)
          throw new UnauthorizedException('Unable to link this Google account');
      }
      return this.insertSession(db, grant.userId, userAgent);
    });
    if (!result)
      throw new UnauthorizedException('Invalid or expired Google sign-in code');
    return this.issue(result.session, result.token);
  }
}
