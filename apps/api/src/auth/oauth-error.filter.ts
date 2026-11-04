import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Response } from 'express';
import { AuthCookies } from './auth.cookies';

@Catch()
export class OAuthErrorFilter implements ExceptionFilter {
  constructor(private readonly cookies: AuthCookies) {}

  catch(error: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    res.clearCookie(
      this.cookies.config.cookieNames.oauth,
      this.cookies.options,
    );
    const nonce = randomBytes(24).toString('base64');
    const origin = JSON.stringify(this.cookies.config.frontendOrigin).replace(
      /</g,
      '\\u003c',
    );
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`,
    );
    res
      .status(error instanceof HttpException ? error.getStatus() : 500)
      .type('html')
      .send(
        `<!doctype html><html><body><script nonce="${nonce}">if(window.opener){window.opener.postMessage({type:'google-oauth-error'},${origin});}window.close();</script></body></html>`,
      );
  }
}
