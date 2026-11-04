import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { doubleCsrf } from 'csrf-csrf';
import { randomBytes } from 'node:crypto';
import { Request, Response } from 'express';
import { AuthCookies, readCookie } from './auth.cookies';

@Injectable()
export class CsrfService {
  private readonly csrf: ReturnType<typeof doubleCsrf>;

  constructor(private readonly cookies: AuthCookies) {
    this.csrf = doubleCsrf({
      getSecret: () => cookies.config.csrfSecret,
      getSessionIdentifier: (req) =>
        readCookie(req, cookies.config.cookieNames.binding) ?? '',
      cookieName: cookies.config.cookieNames.csrf,
      cookieOptions: {
        ...cookies.options,
        maxAge: cookies.config.sessionMilliseconds,
      },
      getCsrfTokenFromRequest: (req) => req.get('x-csrf-token'),
    });
  }

  issue(req: Request, res: Response): string {
    const name = this.cookies.config.cookieNames.binding;
    if (!/^[A-Za-z0-9_-]{43}$/.test(readCookie(req, name) ?? '')) {
      const binding = randomBytes(32).toString('base64url');
      res.cookie(name, binding, {
        ...this.cookies.options,
        maxAge: this.cookies.config.sessionMilliseconds,
      });
      req.cookies = {
        ...(req.cookies as Record<string, unknown> | undefined),
        [name]: binding,
      };
    }
    return this.csrf.generateCsrfToken(req, res);
  }

  validate(req: Request, res: Response): Promise<boolean> {
    if (
      req.get('origin') !== this.cookies.config.frontendOrigin ||
      !readCookie(req, this.cookies.config.cookieNames.binding)
    )
      throw new ForbiddenException('Invalid request origin or CSRF token');
    return new Promise((resolve, reject) => {
      this.csrf.doubleCsrfProtection(req, res, (error?: unknown) => {
        if (error) reject(new ForbiddenException('Invalid CSRF token'));
        else resolve(true);
      });
    });
  }
}

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrf: CsrfService) {}
  canActivate(context: ExecutionContext): Promise<boolean> {
    return this.csrf.validate(
      context.switchToHttp().getRequest<Request>(),
      context.switchToHttp().getResponse<Response>(),
    );
  }
}
