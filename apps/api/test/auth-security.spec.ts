import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Profile } from 'passport-google-oauth20';
import { AuthConfig } from '../src/auth/auth.config';
import { AuthCookies } from '../src/auth/auth.cookies';
import { AuthService } from '../src/auth/auth.service';
import { AtStrategy } from '../src/auth/strategies/at.strategy';
import { GoogleStrategy } from '../src/auth/strategies/google.strategy';
import { OAuthStateStore, tokenHash } from '../src/auth/oauth-state.store';

function config(overrides: Record<string, unknown> = {}): AuthConfig {
  const values: Record<string, unknown> = {
    JWT_ACCESS_SECRET: randomBytes(48).toString('base64'),
    CSRF_SECRET: randomBytes(48).toString('base64'),
    FRONTEND_ORIGIN: 'http://localhost:4200',
    GOOGLE_CLIENT_ID: 'unused-test-client',
    GOOGLE_CLIENT_SECRET: 'unused-test-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3333/api/auth/google/callback',
    NODE_ENV: 'test',
    ...overrides,
  };
  const service = new ConfigService();
  jest.spyOn(service, 'get').mockImplementation((key) => values[String(key)]);
  return new AuthConfig(service);
}

describe('Authentication configuration', () => {
  describe.each(['JWT_ACCESS_SECRET', 'CSRF_SECRET'])('%s', (name) => {
    it.each([
      undefined,
      '',
      'short',
      'a'.repeat(64),
      'abcdefgh01234567'.repeat(4),
      'replace-me-' + randomBytes(48).toString('base64'),
    ])('rejects a missing or weak key', (value) => {
      expect(() => config({ [name]: value })).toThrow(name);
    });
  });
  it('requires independent secrets', () => {
    const key = randomBytes(48).toString('base64');
    expect(() => config({ JWT_ACCESS_SECRET: key, CSRF_SECRET: key })).toThrow(
      'must differ',
    );
  });
  it.each([
    '*',
    'http://localhost:4200/path',
    'https://trusted.invalid.evil/path',
  ])('rejects non-origin frontend configuration', (value) => {
    expect(() => config({ FRONTEND_ORIGIN: value })).toThrow();
  });
  it('requires secure cookies in production', () => {
    expect(() =>
      config({ NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'false' }),
    ).toThrow('AUTH_COOKIE_SECURE');
  });
  it('does not disclose a rejected key', () => {
    const value = 'replace-me-very-sensitive-placeholder-value';
    try {
      config({ JWT_ACCESS_SECRET: value });
    } catch (error) {
      expect((error as Error).message).not.toContain(value);
    }
  });
});

describe('Access JWT verification', () => {
  const jwt = new JwtService();
  const settings = config();
  const auth = {
    authenticate: jest.fn((payload: unknown) => Promise.resolve(payload)),
  };
  const payload = {
    sub: 42,
    sid: '6ccfe272-7f10-4790-8025-ff83e678be0c',
    type: 'access',
  };
  function verify(token: string): Promise<unknown> {
    const strategy = new AtStrategy(settings, auth as unknown as AuthService);
    return new Promise((resolve, reject) => {
      strategy.success = resolve;
      strategy.fail = () => reject(new Error('Unauthorized'));
      strategy.error = reject;
      strategy.authenticate({
        headers: { authorization: `Bearer ${token}` },
      } as Request);
    });
  }
  async function sign(overrides: Record<string, unknown> = {}) {
    return jwt.signAsync(payload, {
      secret: settings.accessSecret,
      algorithm: 'HS256',
      issuer: settings.issuer,
      audience: settings.audience,
      expiresIn: 900,
      ...overrides,
    });
  }
  it('accepts a signed access token and checks the database session', async () => {
    await expect(verify(await sign())).resolves.toMatchObject(payload);
    expect(auth.authenticate).toHaveBeenCalledWith(
      expect.objectContaining(payload),
    );
  });
  it.each([
    { secret: 'at-secret' },
    { secret: 'rt-secret' },
    { secret: randomBytes(48).toString('base64') },
    { issuer: 'wrong' },
    { audience: 'wrong' },
    { algorithm: 'HS384' },
    { expiresIn: -1 },
  ])('rejects invalid keys, claims, algorithms and expiry', async (options) => {
    await expect(verify(await sign(options))).rejects.toThrow('Unauthorized');
  });
  it('rejects unsigned tokens', async () => {
    const token =
      Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url') +
      '.' +
      Buffer.from(JSON.stringify(payload)).toString('base64url') +
      '.';
    await expect(verify(token)).rejects.toThrow('Unauthorized');
  });
});

describe('Cookies and Google identities', () => {
  it('sets host-only HttpOnly cookies with a fixed root path', () => {
    const settings = config({ AUTH_COOKIE_SECURE: 'true' });
    const cookies = new AuthCookies(settings);
    const setCookie = jest.fn();
    const res = { cookie: setCookie } as unknown as Response;
    cookies.setRefresh(res, 'opaque-test-value', new Date());
    expect(setCookie).toHaveBeenCalledWith(
      '__Host-mt_refresh',
      'opaque-test-value',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      }),
    );
    expect(cookies.options).not.toHaveProperty('domain');
  });
  it('digests the whole token rather than a truncated bcrypt prefix', () => {
    expect(tokenHash('a'.repeat(72) + 'one')).not.toBe(
      tokenHash('a'.repeat(72) + 'two'),
    );
  });
  const auth = { googleUser: jest.fn().mockResolvedValue({ userId: 42 }) };
  const strategy = new GoogleStrategy(
    config(),
    {} as OAuthStateStore,
    auth as unknown as AuthService,
  );
  function profile(
    verified: boolean,
    email = 'person@gmail.com',
    hd?: string,
  ): Profile {
    return {
      id: 'immutable-google-subject',
      emails: [{ value: email, verified }],
      _json: { hd },
    } as unknown as Profile;
  }
  it('rejects unverified Google emails', async () => {
    await expect(strategy.validate('', '', profile(false))).rejects.toThrow(
      'verified email',
    );
  });
  it('uses the verified immutable Google identity', async () => {
    await expect(strategy.validate('', '', profile(true))).resolves.toEqual({
      userId: 42,
    });
    expect(auth.googleUser).toHaveBeenLastCalledWith(
      'immutable-google-subject',
      'person@gmail.com',
    );
  });
  it('passes a verified identity to the account-linking service', async () => {
    await strategy.validate('', '', profile(true, 'person@external.invalid'));
    expect(auth.googleUser).toHaveBeenLastCalledWith(
      'immutable-google-subject',
      'person@external.invalid',
    );
  });
});
