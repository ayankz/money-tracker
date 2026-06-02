import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface OAuthMessageData {
  type?: string;
  error?: string;
  message?: string;
  tokens?: {
    access_token?: string;
    accessToken?: string;
    refresh_token?: string;
    refreshToken?: string;
  };
}

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auth {
  private readonly BACKEND_ORIGIN = environment.backendOrigin;
  private readonly GOOGLE_OAUTH_URL = `${this.BACKEND_ORIGIN}/api/auth/google`;
  private readonly GOOGLE_POPUP_WIDTH = 520;
  private readonly GOOGLE_POPUP_HEIGHT = 700;
  private readonly OAUTH_TIMEOUT_MS = 120000;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  serverError = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  private formEvents = toSignal(
    merge(this.form.statusChanges, this.form.valueChanges),
    { initialValue: null }
  );

  isValid = computed(() => {
    this.formEvents();
    return this.form.valid;
  });

  emailError = computed(() => {
    this.formEvents();
    const ctrl = this.form.controls.email;

    if (!ctrl.touched || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'Email обязателен';
    if (ctrl.errors['email']) return 'Введите корректный email';

    return null;
  });

  passwordError = computed(() => {
    this.formEvents();
    const ctrl = this.form.controls.password;

    if (!ctrl.touched || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'Пароль обязателен';
    if (ctrl.errors['minlength']) return 'Минимум 6 символов';

    return null;
  });

  private setLoading(value: boolean): void {
    this.isLoading.set(value);

    if (value) {
      this.form.disable({ emitEvent: false });
      return;
    }

    this.form.enable({ emitEvent: false });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.setLoading(true);
    this.serverError.set(null);

    const dto = this.form.getRawValue() as {
      email: string;
      password: string;
    };

    this.authService.signin(dto).subscribe({
      next: () => {
        this.setLoading(false);
        void this.router.navigateByUrl('/home', { replaceUrl: true });
      },
      error: (err) => {
        console.error('signin error', err);
        this.serverError.set(err?.error?.message ?? 'Ошибка входа');
        this.setLoading(false);
      },
    });
  }

  signInWithGoogle(): void {
    if (this.isLoading()) return;

    this.serverError.set(null);
    this.setLoading(true);

    const left =
      window.screenX + (window.outerWidth - this.GOOGLE_POPUP_WIDTH) / 2;
    const top =
      window.screenY + (window.outerHeight - this.GOOGLE_POPUP_HEIGHT) / 2;

    const features = [
      `width=${this.GOOGLE_POPUP_WIDTH}`,
      `height=${this.GOOGLE_POPUP_HEIGHT}`,
      `left=${Math.max(0, Math.round(left))}`,
      `top=${Math.max(0, Math.round(top))}`,
      'resizable=yes',
      'scrollbars=yes',
    ].join(',');

    const popup = window.open(
      this.GOOGLE_OAUTH_URL,
      'google-oauth',
      features
    );

    if (!popup) {
      this.serverError.set('Браузер заблокировал popup окно');
      this.setLoading(false);
      return;
    }

    let isFinished = false;

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
    };

    const finishWithError = (message: string) => {
      if (isFinished) return;

      isFinished = true;
      cleanup();
      popup.close();

      this.serverError.set(message);
      this.setLoading(false);
    };

    const finishWithTokens = (accessToken: string, refreshToken: string) => {
      if (isFinished) return;

      isFinished = true;
      cleanup();

      this.authService.saveTokens({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      this.setLoading(false);
      void this.router.navigateByUrl('/home', { replaceUrl: true });
    };

    const readTokenPayload = (payload: OAuthMessageData) => {
      const accessToken =
        payload.tokens?.access_token ?? payload.tokens?.accessToken;

      const refreshToken =
        payload.tokens?.refresh_token ?? payload.tokens?.refreshToken;

      if (accessToken && refreshToken) {
        finishWithTokens(accessToken, refreshToken);
        return;
      }

      const oauthError = payload.error ?? payload.message;

      if (oauthError) {
        finishWithError(oauthError);
        return;
      }

   

      finishWithError('Google OAuth не вернул токены');
    };

    const onMessage = (event: MessageEvent<OAuthMessageData>) => {
      if (event.origin !== this.BACKEND_ORIGIN) return;
      if (!event.data || typeof event.data !== 'object') return;

      readTokenPayload(event.data);
    };

    window.addEventListener('message', onMessage);

    const timeout = window.setTimeout(() => {
      finishWithError(
        'OAuth авторизация заняла слишком много времени. Повторите попытку.'
      );
    }, this.OAUTH_TIMEOUT_MS);
  }
}
