import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { isEmail } from 'class-validator';
import { AuthConfig } from '../auth.config';
import { AuthService } from '../auth.service';
import { OAuthStateStore } from '../oauth-state.store';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: AuthConfig,
    store: OAuthStateStore,
    private readonly auth: AuthService,
  ) {
    super({
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
      callbackURL: config.googleCallback,
      scope: ['email', 'profile'],
      state: true,
      store,
    });
  }
  async validate(_access: string, _refresh: string, profile: Profile) {
    const email = profile.emails?.find((item) => item.verified === true)?.value;
    if (!profile.id || !email || !isEmail(email))
      throw new UnauthorizedException('Google must provide a verified email');
    return this.auth.googleUser(profile.id, email);
  }
}
