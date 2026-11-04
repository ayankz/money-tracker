import { randomBytes, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';
import { Response as TestResponse } from 'supertest';
import { Server } from 'node:http';
import { Profile } from 'passport-google-oauth20';
import { AuthModule } from '../src/auth/auth.module';
import { AuthConfig } from '../src/auth/auth.config';
import { AuthService } from '../src/auth/auth.service';
import { GoogleStrategy } from '../src/auth/strategies/google.strategy';
import { AtGuard } from '../src/common/guards/at.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import { tokenHash } from '../src/auth/oauth-state.store';

const origin = 'http://localhost:4200';
const password = 'Strong-test-password-123';
type Access = { access_token: string; expires_in: number };
function json<T>(res: TestResponse): T {
  return res.body as T;
}

class Browser {
  readonly jar: Record<string, string> = {};
  csrf = '';
  constructor(private readonly app: INestApplication<Server>) {}
  header(): string {
    return Object.entries(this.jar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
  remember(res: TestResponse): TestResponse {
    const values: unknown = res.headers['set-cookie'];
    for (const value of Array.isArray(values) ? (values as string[]) : []) {
      const [pair] = value.split(';');
      const split = pair.indexOf('=');
      const key = pair.slice(0, split);
      const token = pair.slice(split + 1);
      if (token) this.jar[key] = token;
      else delete this.jar[key];
    }
    return res;
  }
  async init(): Promise<this> {
    const res = await request(this.app.getHttpServer()).get('/api/auth/csrf');
    expect(res.status).toBe(200);
    this.remember(res);
    this.csrf = json<{ csrfToken: string }>(res).csrfToken;
    return this;
  }
  async post(
    path: string,
    body: object = {},
    access?: string,
  ): Promise<TestResponse> {
    let call = request(this.app.getHttpServer())
      .post('/api/auth/' + path)
      .set('Cookie', this.header())
      .set('Origin', origin)
      .set('X-CSRF-Token', this.csrf);
    if (access) call = call.set('Authorization', `Bearer ${access}`);
    return this.remember(await call.send(body));
  }
  async get(path: string, access?: string): Promise<TestResponse> {
    let call = request(this.app.getHttpServer())
      .get('/api/auth/' + path)
      .set('Cookie', this.header());
    if (access) call = call.set('Authorization', `Bearer ${access}`);
    return this.remember(await call);
  }
  async signup(email = `user-${randomUUID()}@example.invalid`) {
    const res = await this.post('local/signup', { email, password });
    expect(res.status).toBe(201);
    return { email, access: json<Access>(res).access_token, response: res };
  }
}

describe('Authentication with PostgreSQL', () => {
  let app: INestApplication<Server>;
  let db: PrismaService;
  let auth: AuthService;
  let settings: AuthConfig;
  let providerProfile: Profile;
  const providerExchange = jest.fn(
    (
      _code: string,
      _params: unknown,
      done: (
        err: Error | null,
        access: string,
        refresh: string,
        params: object,
      ) => void,
    ) => done(null, 'mock-provider-access', '', {}),
  );
  let previousDatabase: string | undefined;

  beforeAll(async () => {
    const database = process.env.AUTH_TEST_DATABASE_URL;
    if (!database)
      throw new Error(
        'AUTH_TEST_DATABASE_URL must explicitly name a disposable local database',
      );
    const url = new URL(database);
    if (url.hostname !== '127.0.0.1' || !url.pathname.endsWith('_auth_test'))
      throw new Error(
        'Refusing to run auth tests against a non-local or non-test database',
      );
    previousDatabase = process.env.DATABASE_URL;
    process.env.DATABASE_URL = database;
    settings = new AuthConfig(
      new ConfigService({
        JWT_ACCESS_SECRET: randomBytes(48).toString('base64'),
        CSRF_SECRET: randomBytes(48).toString('base64'),
        FRONTEND_ORIGIN: origin,
        GOOGLE_CLIENT_ID: 'unused-test-client',
        GOOGLE_CLIENT_SECRET: 'unused-test-client-secret',
        GOOGLE_CALLBACK_URL: 'http://localhost:3333/api/auth/google/callback',
        NODE_ENV: 'test',
        AUTH_COOKIE_SECURE: 'false',
      }),
    );
    const module = await Test.createTestingModule({
      imports: [AuthModule],
      providers: [{ provide: APP_GUARD, useClass: AtGuard }],
    })
      .overrideProvider(AuthConfig)
      .useValue(settings)
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication<INestApplication<Server>>();
    app.setGlobalPrefix('api');
    app.enableCors({ origin, credentials: true });
    await app.init();
    db = module.get(PrismaService);
    auth = module.get(AuthService);
    const google = module.get(GoogleStrategy);
    const oauth = google as unknown as {
      _oauth2: { getOAuthAccessToken: typeof providerExchange };
    };
    oauth._oauth2.getOAuthAccessToken = providerExchange;
    google.userProfile = (_access, done) => done(null, providerProfile);
  });
  afterAll(async () => {
    if (app) await app.close();
    if (previousDatabase === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabase;
  });
  beforeEach(() => {
    providerExchange.mockClear();
    providerProfile = {
      id: `google-${randomUUID()}`,
      emails: [{ value: `google-${randomUUID()}@gmail.com`, verified: true }],
      _json: {},
    } as unknown as Profile;
  });
  async function browser() {
    return new Browser(app).init();
  }
  async function me(access: string) {
    return request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${access}`);
  }
  async function startGoogle(b: Browser) {
    const res = await b.get('google');
    expect(res.status).toBe(302);
    const location = String(res.headers.location);
    const state = new URL(location).searchParams.get('state');
    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    return state!;
  }

  it('retains legacy password hashes and every financial data type', async () => {
    const b = await browser();
    const old = await db.user.findUniqueOrThrow({ where: { id: 424242 } });
    const res = await b.post('local/signin', {
      email: 'legacy@gmail.com',
      password: 'legacy-only-test-password',
    });
    expect(res.status).toBe(200);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: old.id } })).hash,
    ).toBe(old.hash);
    expect(
      (
        await db.account.findUniqueOrThrow({ where: { id: 424242 } })
      ).balance.toString(),
    ).toBe('123.45');
    expect(await db.transaction.count({ where: { userId: old.id } })).toBe(1);
    expect(await db.transfer.count({ where: { userId: old.id } })).toBe(1);
    expect(await db.upcomingPayment.count({ where: { userId: old.id } })).toBe(
      1,
    );
  });
  it('returns an access JWT and only an HttpOnly refresh cookie; hashes the full opaque token', async () => {
    const b = await browser();
    const result = await b.signup();
    const accessBody = json<Access>(result.response);
    expect(Object.keys(accessBody).sort()).toEqual([
      'access_token',
      'expires_in',
    ]);
    expect(typeof accessBody.access_token).toBe('string');
    expect(accessBody.expires_in).toBe(900);
    const cookies = result.response.headers[
      'set-cookie'
    ] as unknown as string[];
    expect(
      cookies.some(
        (value) =>
          value.startsWith('mt_refresh=') &&
          value.includes('HttpOnly') &&
          value.includes('SameSite=Lax') &&
          value.includes('Path=/'),
      ),
    ).toBe(true);
    const raw = b.jar.mt_refresh;
    expect(raw).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const stored = await db.refreshToken.findUniqueOrThrow({
      where: { hash: tokenHash(raw) },
    });
    expect(stored.hash).not.toBe(raw);
    expect((await me(result.access)).status).toBe(200);
    expect(result.response.headers['cache-control']).toBe('no-store');
  });
  it('preserves password sign-in and uses generic invalid-credential errors', async () => {
    const b = await browser();
    const { email } = await b.signup();
    expect((await b.post('local/signin', { email, password })).status).toBe(
      200,
    );
    const bad = await b.post('local/signin', { email, password: 'wrong' });
    const missing = await b.post('local/signin', {
      email: 'missing@example.invalid',
      password: 'wrong',
    });
    expect(bad.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(bad.body).toEqual(missing.body);
  });
  it('rejects weak and bcrypt-truncated signup passwords', async () => {
    const b = await browser();
    expect(
      (
        await b.post('local/signup', {
          email: `weak-${randomUUID()}@example.invalid`,
          password: 'short',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await b.post('local/signup', {
          email: `unicode-${randomUUID()}@example.invalid`,
          password: 'é'.repeat(40),
        })
      ).status,
    ).toBe(400);
  });
  it('rotates refresh tokens and rejects old refresh bearer/body credentials', async () => {
    const b = await browser();
    await b.signup();
    const previous = b.jar.mt_refresh;
    const refreshed = await b.post('refresh');
    expect(refreshed.status).toBe(200);
    expect(b.jar.mt_refresh).not.toBe(previous);
    expect(
      (
        await db.refreshToken.findUniqueOrThrow({
          where: { hash: tokenHash(previous) },
        })
      ).consumedAt,
    ).not.toBeNull();
    const cookieLess = await browser();
    expect(
      (await cookieLess.post('refresh', { refresh_token: previous }, previous))
        .status,
    ).toBe(401);
  });
  it('commits replay revocation and immediately rejects the newest access token', async () => {
    const b = await browser();
    await b.signup();
    const old = b.jar.mt_refresh;
    const next = await b.post('refresh');
    expect(next.status).toBe(200);
    const access = json<Access>(next).access_token;
    const replay = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set(
        'Cookie',
        b
          .header()
          .replace(`mt_refresh=${b.jar.mt_refresh}`, `mt_refresh=${old}`),
      )
      .set('Origin', origin)
      .set('X-CSRF-Token', b.csrf)
      .send({});
    expect(replay.status).toBe(401);
    expect((await me(access)).status).toBe(401);
    expect((await b.post('refresh')).status).toBe(401);
  });
  it('atomically handles simultaneous rotations of the same refresh token', async () => {
    const b = await browser();
    await b.signup();
    const cookie = b.header();
    const rotate = () =>
      request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookie)
        .set('Origin', origin)
        .set('X-CSRF-Token', b.csrf)
        .send({});
    const responses = await Promise.all([rotate(), rotate()]);
    expect(responses.map((res) => res.status).sort()).toEqual([200, 401]);
    const winner = responses.find((res) => res.status === 200)!;
    expect((await me(json<Access>(winner).access_token)).status).toBe(401);
  });
  it('does not revoke a session for an unrecognized random token', async () => {
    const b = await browser();
    const { access } = await b.signup();
    const cookies = b
      .header()
      .replace(
        `mt_refresh=${b.jar.mt_refresh}`,
        `mt_refresh=${randomBytes(32).toString('base64url')}`,
      );
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/auth/refresh')
          .set('Cookie', cookies)
          .set('Origin', origin)
          .set('X-CSRF-Token', b.csrf)
          .send({})
      ).status,
    ).toBe(401);
    expect((await me(access)).status).toBe(200);
  });
  it('rejects expired sessions for access and refresh', async () => {
    const b = await browser();
    const { access } = await b.signup();
    const token = await db.refreshToken.findUniqueOrThrow({
      where: { hash: tokenHash(b.jar.mt_refresh) },
    });
    await db.authSession.update({
      where: { id: token.sessionId },
      data: { expiresAt: new Date(0) },
    });
    expect((await me(access)).status).toBe(401);
    expect((await b.post('refresh')).status).toBe(401);
  });
  it('logs out idempotently using the refresh cookie and revokes access immediately', async () => {
    const b = await browser();
    const { access } = await b.signup();
    expect((await b.post('logout')).status).toBe(204);
    expect(b.jar.mt_refresh).toBeUndefined();
    expect((await me(access)).status).toBe(401);
    expect((await b.post('logout')).status).toBe(204);
  });
  it('lists sessions without exposing token hashes and revokes only owned sessions', async () => {
    const a = await browser();
    const first = await a.signup();
    const b = await browser();
    const second = await b.signup();
    const list = await a.get('sessions', first.access);
    expect(list.status).toBe(200);
    const entries = json<Array<{ id: string; current: boolean }>>(list);
    expect(entries).toHaveLength(1);
    expect(entries[0].current).toBe(true);
    expect(JSON.stringify(list.body)).not.toMatch(/hash|refreshToken/);
    const other = json<Array<{ id: string }>>(
      await b.get('sessions', second.access),
    )[0].id;
    const revoke = (id: string) =>
      request(app.getHttpServer())
        .delete('/api/auth/sessions/' + id)
        .set('Authorization', `Bearer ${first.access}`)
        .set('Cookie', a.header())
        .set('Origin', origin)
        .set('X-CSRF-Token', a.csrf);
    expect((await revoke(other)).status).toBe(204);
    expect((await me(second.access)).status).toBe(200);
    expect((await revoke(entries[0].id)).status).toBe(204);
    expect((await me(first.access)).status).toBe(401);
  });
  it('logs out all sessions for one user without affecting other users', async () => {
    const a = await browser();
    const first = await a.signup();
    const b = await browser();
    const signin = await b.post('local/signin', {
      email: first.email,
      password,
    });
    const second = json<Access>(signin).access_token;
    const other = await browser();
    const third = await other.signup();
    expect((await a.post('logout-all', {}, first.access)).status).toBe(204);
    expect((await me(first.access)).status).toBe(401);
    expect((await me(second)).status).toBe(401);
    expect((await me(third.access)).status).toBe(200);
  });
  it.each([
    'local/signup',
    'local/signin',
    'refresh',
    'logout',
    'google/exchange',
  ])('requires CSRF for %s', async (path) => {
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/auth/' + path)
          .set('Origin', origin)
          .send({})
      ).status,
    ).toBe(403);
  });
  it('rejects foreign origins even with valid CSRF cookies and header', async () => {
    const b = await browser();
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Cookie', b.header())
          .set('X-CSRF-Token', b.csrf)
          .set('Origin', 'https://attacker.invalid')
          .send({})
      ).status,
    ).toBe(403);
  });
  it('binds CSRF tokens to the browser and rejects forged values', async () => {
    const a = await browser();
    const b = await browser();
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Cookie', b.header())
          .set('Origin', origin)
          .set('X-CSRF-Token', a.csrf)
          .send({})
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Cookie', a.header())
          .set('Origin', origin)
          .set('X-CSRF-Token', 'forged')
          .send({})
      ).status,
    ).toBe(403);
  });
  it('uses browser-bound, one-time OAuth state and a one-time code exchange', async () => {
    const b = await browser();
    const state = await startGoogle(b);
    const oldCookie = b.header();
    expect(
      await db.oAuthState.findUnique({ where: { hash: tokenHash(state) } }),
    ).not.toBeNull();
    const callback = await b.get(
      `google/callback?state=${state}&code=mock-google-code`,
    );
    expect(callback.status).toBe(200);
    expect(providerExchange).toHaveBeenCalledTimes(1);
    expect(callback.headers['cache-control']).toBe('no-store');
    expect(callback.headers['content-security-policy']).toContain(
      "default-src 'none'",
    );
    expect(callback.text).not.toContain('access_token');
    expect(callback.text).not.toContain('refresh_token');
    const code = /"code":"([A-Za-z0-9_-]{43})"/.exec(callback.text)?.[1];
    expect(code).toBeDefined();
    expect((await b.post('google/exchange', { code })).status).toBe(200);
    expect((await b.post('google/exchange', { code })).status).toBe(401);
    expect(
      (
        await request(app.getHttpServer())
          .get(`/api/auth/google/callback?state=${state}&code=mock-google-code`)
          .set('Cookie', oldCookie)
      ).status,
    ).toBeGreaterThanOrEqual(400);
  });
  it('rejects missing, forged and other-browser OAuth state before contacting Google', async () => {
    const owner = await browser();
    const state = await startGoogle(owner);
    const stranger = await browser();
    expect(
      (
        await stranger.get(
          `google/callback?state=${state}&code=mock-google-code`,
        )
      ).status,
    ).toBeGreaterThanOrEqual(400);
    expect(
      (await owner.get('google/callback?code=mock-google-code')).status,
    ).toBeGreaterThanOrEqual(400);
    expect(
      (
        await owner.get(
          `google/callback?state=${randomBytes(32).toString('base64url')}&code=mock-google-code`,
        )
      ).status,
    ).toBeGreaterThanOrEqual(400);
    expect(providerExchange).not.toHaveBeenCalled();
  });
  it('rejects expired OAuth state and grants', async () => {
    const b = await browser();
    const state = await startGoogle(b);
    await db.oAuthState.update({
      where: { hash: tokenHash(state) },
      data: { expiresAt: new Date(0) },
    });
    expect(
      (await b.get(`google/callback?state=${state}&code=mock-google-code`))
        .status,
    ).toBeGreaterThanOrEqual(400);
    expect(providerExchange).not.toHaveBeenCalled();
    const code = await auth.googleGrant(424242);
    await db.oAuthGrant.update({
      where: { hash: tokenHash(code) },
      data: { expiresAt: new Date(0) },
    });
    expect((await b.post('google/exchange', { code })).status).toBe(401);
  });
  it('rejects unverified Google email profiles', async () => {
    providerProfile.emails![0].verified = false;
    const b = await browser();
    const state = await startGoogle(b);
    expect(
      (await b.get(`google/callback?state=${state}&code=mock-google-code`))
        .status,
    ).toBe(401);
  });
  it('requires password proof to link Google without replacing a legacy user or hash', async () => {
    const old = await db.user.findUniqueOrThrow({ where: { id: 424242 } });
    const identity = await auth.googleUser(
      'legacy-google-fixture',
      'legacy@gmail.com',
    );
    const code = await auth.googleGrant(identity.userId, identity.linkSubject);
    const b = await browser();
    if (identity.linkSubject) {
      expect((await b.post('google/exchange', { code })).status).toBe(409);
      expect(
        (await b.post('google/exchange', { code, password: 'wrong' })).status,
      ).toBe(409);
    }
    expect(
      (
        await b.post('google/exchange', {
          code,
          password: 'legacy-only-test-password',
        })
      ).status,
    ).toBe(200);
    expect(
      await auth.googleUser('legacy-google-fixture', 'changed@gmail.com'),
    ).toEqual({ userId: 424242 });
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: 424242 } })).hash,
    ).toBe(old.hash);
    expect(
      (await db.account.findUniqueOrThrow({ where: { id: 424242 } })).userId,
    ).toBe(424242);
  });
  it('never auto-links an existing account by email, even a verified Gmail email', async () => {
    const b = await browser();
    const account = await b.signup('local-' + randomUUID() + '@gmail.com');
    const subject = 'new-google-' + randomUUID();
    const identity = await auth.googleUser(subject, account.email);
    const old = await db.user.findUniqueOrThrow({
      where: { email: account.email },
    });
    expect(identity.linkSubject).toBe(subject);
    expect(old.googleSubject).toBeNull();
    const code = await auth.googleGrant(identity.userId, identity.linkSubject);
    expect((await b.post('google/exchange', { code })).status).toBe(409);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: old.id } }))
        .googleSubject,
    ).toBeNull();
    expect((await b.post('google/exchange', { code, password })).status).toBe(
      200,
    );
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: old.id } }))
        .googleSubject,
    ).toBe(subject);
  });
  it('consumes Google exchange grants atomically', async () => {
    const b = await browser();
    const code = await auth.googleGrant(424242);
    const exchange = () =>
      request(app.getHttpServer())
        .post('/api/auth/google/exchange')
        .set('Cookie', b.header())
        .set('Origin', origin)
        .set('X-CSRF-Token', b.csrf)
        .send({ code });
    expect(
      (await Promise.all([exchange(), exchange()]))
        .map((res) => res.status)
        .sort(),
    ).toEqual([200, 401]);
  });
  it('reports Google cancellation as a trusted popup error and clears its binding cookie', async () => {
    const b = await browser();
    const state = await startGoogle(b);
    const res = await b.get(
      `google/callback?state=${state}&error=access_denied`,
    );
    expect(res.status).toBe(401);
    expect(res.text).toContain('google-oauth-error');
    expect(res.text).toContain(JSON.stringify(origin));
    expect(res.text).not.toContain('access_token');
    expect(res.text).not.toContain('refresh_token');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['content-security-policy']).toContain(
      "default-src 'none'",
    );
    expect(b.jar.mt_oauth).toBeUndefined();
    expect(providerExchange).not.toHaveBeenCalled();
  });
  it('handles a provider exchange failure without leaking provider error details', async () => {
    const b = await browser();
    const state = await startGoogle(b);
    providerExchange.mockImplementationOnce((_code, _params, done) =>
      done(new Error('sensitive-provider-detail'), '', '', {}),
    );
    const res = await b.get(
      `google/callback?state=${state}&code=mock-google-code`,
    );
    expect(res.status).toBe(500);
    expect(res.text).toContain('google-oauth-error');
    expect(res.text).not.toContain('sensitive-provider-detail');
    expect(res.text).not.toContain('access_token');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(b.jar.mt_oauth).toBeUndefined();
  });
});
