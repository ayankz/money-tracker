import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import * as cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleGuard } from '../common/guards/google.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthConfig } from './auth.config';
import { AuthCookies } from './auth.cookies';
import { CsrfGuard, CsrfService } from './csrf.service';
import { OAuthStateStore } from './oauth-state.store';
import { OAuthErrorFilter } from './oauth-error.filter';
import { AtStrategy } from './strategies/at.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.register({}),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthConfig,
    AuthCookies,
    CsrfService,
    CsrfGuard,
    OAuthStateStore,
    OAuthErrorFilter,
    AuthService,
    AtStrategy,
    GoogleStrategy,
    GoogleGuard,
  ],
  exports: [AuthConfig],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        cookieParser(),
        (_req: Request, res: Response, next: NextFunction) => {
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('Pragma', 'no-cache');
          next();
        },
      )
      .forRoutes(AuthController);
  }
}
