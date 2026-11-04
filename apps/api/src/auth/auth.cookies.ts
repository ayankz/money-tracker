import { Injectable } from '@nestjs/common';
import { CookieOptions, Request, Response } from 'express';
import { AuthConfig } from './auth.config';

export function readCookie(req: Request, name: string): string | undefined {
  const value: unknown = (req.cookies as Record<string, unknown> | undefined)?.[
    name
  ];
  return typeof value === 'string' ? value : undefined;
}

@Injectable()
export class AuthCookies {
  constructor(readonly config: AuthConfig) {}

  get options(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.secureCookies,
      sameSite: 'lax',
      path: '/',
    };
  }

  setRefresh(res: Response, token: string, expiresAt: Date): void {
    res.cookie(this.config.cookieNames.refresh, token, {
      ...this.options,
      expires: expiresAt,
    });
  }

  clearRefresh(res: Response): void {
    res.clearCookie(this.config.cookieNames.refresh, this.options);
  }

  refresh(req: Request): string | undefined {
    return readCookie(req, this.config.cookieNames.refresh);
  }
}
