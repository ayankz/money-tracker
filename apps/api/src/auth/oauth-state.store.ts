import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { Request } from 'express';
import {
  Metadata,
  StateStoreStoreCallback,
  StateStoreVerifyCallback,
} from 'passport-oauth2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthCookies, readCookie } from './auth.cookies';

export function tokenHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class OAuthStateStore {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cookies: AuthCookies,
  ) {}

  // Passport dispatches by function arity; these overloads also satisfy its store contract.
  store(req: Request, done: StateStoreStoreCallback): void;
  store(req: Request, meta: Metadata, done: StateStoreStoreCallback): void;
  store(
    req: Request,
    metaOrDone: Metadata | StateStoreStoreCallback,
    callback?: StateStoreStoreCallback,
  ): void {
    const done = typeof metaOrDone === 'function' ? metaOrDone : callback!;
    void this.create(req).then(
      (state) => done(null, state),
      (error: Error) => done(error, undefined),
    );
  }

  verify(req: Request, state: string, done: StateStoreVerifyCallback): void;
  verify(
    req: Request,
    state: string,
    meta: Metadata,
    done: StateStoreVerifyCallback,
  ): void;
  verify(
    req: Request,
    state: string,
    metaOrDone: Metadata | StateStoreVerifyCallback,
    callback?: StateStoreVerifyCallback,
  ): void {
    const done = typeof metaOrDone === 'function' ? metaOrDone : callback!;
    void this.consume(req, state).then(
      (valid) => done(null, valid, undefined),
      (error: Error) => done(error, false, undefined),
    );
  }

  private async create(req: Request): Promise<string> {
    const state = randomBytes(32).toString('base64url');
    const binding = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.oAuthState.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    await this.prisma.oAuthState.create({
      data: {
        hash: tokenHash(state),
        bindingHash: tokenHash(binding),
        expiresAt,
      },
    });
    if (!req.res) throw new Error('OAuth response is unavailable');
    req.res.cookie(this.cookies.config.cookieNames.oauth, binding, {
      ...this.cookies.options,
      expires: expiresAt,
    });
    return state;
  }

  private async consume(req: Request, state: string): Promise<boolean> {
    const binding = readCookie(req, this.cookies.config.cookieNames.oauth);
    req.res?.clearCookie(
      this.cookies.config.cookieNames.oauth,
      this.cookies.options,
    );
    if (
      !binding ||
      typeof state !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(state)
    )
      return false;
    const result = await this.prisma.oAuthState.deleteMany({
      where: {
        hash: tokenHash(state),
        bindingHash: tokenHash(binding),
        expiresAt: { gt: new Date() },
      },
    });
    return result.count === 1;
  }
}
