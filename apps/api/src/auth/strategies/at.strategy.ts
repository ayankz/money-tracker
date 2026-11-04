import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthConfig } from '../auth.config';
import { AuthService } from '../auth.service';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: AuthConfig,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.accessSecret,
      algorithms: ['HS256'],
      issuer: config.issuer,
      audience: config.audience,
    });
  }
  validate(payload: { sub?: unknown; sid?: unknown; type?: unknown }) {
    return this.auth.authenticate(payload);
  }
}
