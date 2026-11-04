import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { randomBytes } from 'node:crypto';
import { Request, Response } from 'express';
import { GoogleGuard } from '../common/guards/google.guard';
import { Public } from '../common/decorators/public.decorator';
import { AuthService, SessionTokens } from './auth.service';
import { AuthCookies } from './auth.cookies';
import { CsrfGuard, CsrfService } from './csrf.service';
import { SigninDto, SignupDto, GoogleExchangeDto } from './dto/auth.dto';
import { JwtPayload } from './types';
import { OAuthErrorFilter } from './oauth-error.filter';

@Controller('auth')
@UseGuards(ThrottlerGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
    private readonly csrf: CsrfService,
  ) {}

  private respond(res: Response, result: SessionTokens) {
    this.cookies.setRefresh(res, result.refreshToken, result.expiresAt);
    return result.access;
  }

  @Public()
  @Get('csrf')
  csrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return { csrfToken: this.csrf.issue(req, res) };
  }

  @Public()
  @Post('local/signup')
  @UseGuards(CsrfGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async signup(
    @Body() dto: SignupDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(
      res,
      await this.auth.signup(dto, req.get('user-agent')),
    );
  }

  @Public()
  @Post('local/signin')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async signin(
    @Body() dto: SigninDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(
      res,
      await this.auth.signin(dto, req.get('user-agent')),
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      return this.respond(
        res,
        await this.auth.refresh(this.cookies.refresh(req)),
      );
    } catch (error) {
      this.cookies.clearRefresh(res);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.cookies.refresh(req));
    this.cookies.clearRefresh(res);
  }

  @Get('me')
  me(@Req() req: Request & { user: JwtPayload }) {
    return { id: req.user.sub, email: req.user.email };
  }

  @Get('sessions')
  sessions(@Req() req: Request & { user: JwtPayload }) {
    return this.auth.sessions(req.user.sub, req.user.sid);
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  async revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.revoke(req.user.sub, id);
    if (id === req.user.sid) this.cookies.clearRefresh(res);
  }

  @Post('logout-all')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  async logoutAll(
    @Req() req: Request & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.revoke(req.user.sub);
    this.cookies.clearRefresh(res);
  }

  @Public()
  @Get('google')
  @UseFilters(OAuthErrorFilter)
  @UseGuards(GoogleGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  google() {}

  @Public()
  @Get('google/callback')
  @UseFilters(OAuthErrorFilter)
  @UseGuards(GoogleGuard)
  async googleCallback(
    @Req() req: Request & { user: { userId: number; linkSubject?: string } },
    @Res() res: Response,
  ) {
    const code = await this.auth.googleGrant(
      req.user.userId,
      req.user.linkSubject,
    );
    const nonce = randomBytes(24).toString('base64');
    const payload = JSON.stringify({
      type: 'google-oauth-success',
      code,
    }).replace(/</g, '\u003c');
    const origin = JSON.stringify(this.cookies.config.frontendOrigin).replace(
      /</g,
      '\u003c',
    );
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`,
    );
    res.setHeader('Referrer-Policy', 'no-referrer');
    res
      .type('html')
      .send(
        `<!doctype html><html><body><script nonce="${nonce}">if(window.opener){window.opener.postMessage(${payload},${origin});}window.close();</script></body></html>`,
      );
  }

  @Public()
  @Post('google/exchange')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async exchange(
    @Body() dto: GoogleExchangeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(
      res,
      await this.auth.exchangeGoogle(
        dto.code,
        dto.password,
        req.get('user-agent'),
      ),
    );
  }
}
