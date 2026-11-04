import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function required(config: ConfigService, name: string): string {
  const value = config.get<unknown>(name);
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${name} is required`);
  return value;
}

function secret(config: ConfigService, name: string): string {
  const value = required(config, name);
  if (
    value.length < 64 ||
    /\s/.test(value) ||
    new Set(value).size < 8 ||
    /^(.+?)\1+$/.test(value) ||
    /secret|password|change.?me|replace.?me|example/i.test(value)
  ) {
    throw new Error(
      `${name} must be an independent random secret of at least 64 characters`,
    );
  }
  return value;
}

@Injectable()
export class AuthConfig {
  readonly accessSecret: string;
  readonly csrfSecret: string;
  readonly frontendOrigin: string;
  readonly googleClientId: string;
  readonly googleClientSecret: string;
  readonly googleCallback: string;
  readonly secureCookies: boolean;
  readonly issuer: string;
  readonly audience: string;
  readonly trustProxy: number;
  readonly accessSeconds = 15 * 60;
  readonly sessionMilliseconds = 7 * 24 * 60 * 60 * 1000;
  readonly cookieNames: {
    refresh: string;
    binding: string;
    csrf: string;
    oauth: string;
  };

  constructor(config: ConfigService) {
    this.accessSecret = secret(config, 'JWT_ACCESS_SECRET');
    this.csrfSecret = secret(config, 'CSRF_SECRET');
    if (this.accessSecret === this.csrfSecret)
      throw new Error('JWT_ACCESS_SECRET and CSRF_SECRET must differ');
    const production = config.get<string>('NODE_ENV') === 'production';
    const secure =
      config.get<string>('AUTH_COOKIE_SECURE') ?? String(production);
    if (
      !['true', 'false'].includes(secure) ||
      (production && secure !== 'true')
    )
      throw new Error('AUTH_COOKIE_SECURE must be true in production');
    this.secureCookies = secure === 'true';
    this.frontendOrigin = required(config, 'FRONTEND_ORIGIN');
    const frontend = new URL(this.frontendOrigin);
    if (
      frontend.origin !== this.frontendOrigin ||
      !['http:', 'https:'].includes(frontend.protocol) ||
      frontend.username ||
      frontend.password ||
      (production && frontend.protocol !== 'https:')
    )
      throw new Error(
        'FRONTEND_ORIGIN must be an exact trusted HTTP(S) origin (HTTPS in production)',
      );
    this.googleClientId = required(config, 'GOOGLE_CLIENT_ID');
    this.googleClientSecret = required(config, 'GOOGLE_CLIENT_SECRET');
    this.googleCallback = required(config, 'GOOGLE_CALLBACK_URL');
    const callback = new URL(this.googleCallback);
    if (
      !['http:', 'https:'].includes(callback.protocol) ||
      callback.username ||
      callback.password ||
      callback.search ||
      callback.hash ||
      callback.pathname !== '/api/auth/google/callback' ||
      (production && callback.protocol !== 'https:')
    )
      throw new Error(
        'GOOGLE_CALLBACK_URL must be the API /api/auth/google/callback URL (HTTPS in production)',
      );
    this.issuer = config.get<string>('JWT_ISSUER') ?? 'money-tracker-api';
    this.audience = config.get<string>('JWT_AUDIENCE') ?? 'money-tracker-web';
    this.trustProxy = Number(config.get<string>('TRUST_PROXY') ?? '0');
    if (
      !Number.isInteger(this.trustProxy) ||
      this.trustProxy < 0 ||
      this.trustProxy > 3
    )
      throw new Error('TRUST_PROXY must be a hop count between 0 and 3');
    const prefix = this.secureCookies ? '__Host-' : '';
    this.cookieNames = {
      refresh: `${prefix}mt_refresh`,
      binding: `${prefix}mt_binding`,
      csrf: `${prefix}mt_csrf`,
      oauth: `${prefix}mt_oauth`,
    };
  }
}
