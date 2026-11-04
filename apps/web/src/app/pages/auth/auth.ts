import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { Header } from '../../components/header/header';
import { googleCode, googleError } from './oauth-message';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink, Header],
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
  private readonly destroyRef = inject(DestroyRef);

  readonly pendingGoogleCode = signal<string | null>(null);
  isLoading = signal(false);
  serverError = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  private formEvents = toSignal(merge(this.form.statusChanges, this.form.valueChanges), {
    initialValue: null,
  });

  isValid = computed(() => {
    this.formEvents();
    return this.pendingGoogleCode() ? this.form.controls.password.valid : this.form.valid;
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
    const code = this.pendingGoogleCode();
    if (code) {
      if (this.form.controls.password.invalid) return;
      this.completeGoogle(code, this.form.controls.password.value ?? '');
      return;
    }
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

    this.pendingGoogleCode.set(null);
    this.serverError.set(null);
    this.setLoading(true);

    const left = window.screenX + (window.outerWidth - this.GOOGLE_POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - this.GOOGLE_POPUP_HEIGHT) / 2;

    const features = [
      `width=${this.GOOGLE_POPUP_WIDTH}`,
      `height=${this.GOOGLE_POPUP_HEIGHT}`,
      `left=${Math.max(0, Math.round(left))}`,
      `top=${Math.max(0, Math.round(top))}`,
      'resizable=yes',
      'scrollbars=yes',
    ].join(',');

    const popup = window.open(this.GOOGLE_OAUTH_URL, 'google-oauth', features);

    if (!popup) {
      this.serverError.set('Браузер заблокировал popup окно');
      this.setLoading(false);
      return;
    }

    let isFinished = false;
    let closeTimer: number | undefined;
    let unregisterDestroy = () => {};

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.clearTimeout(closeTimer);
      window.clearInterval(closedCheckInterval);
      unregisterDestroy();
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

    const onMessage = (event: MessageEvent<unknown>) => {
      if (googleError(event, popup, this.BACKEND_ORIGIN)) {
        finishWithError('Google sign-in was cancelled or failed. Please try again.');
        return;
      }
      const code = googleCode(event, popup, this.BACKEND_ORIGIN);
      if (!code || isFinished) return;
      isFinished = true;
      cleanup();
      popup.close();
      this.completeGoogle(code);
    };

    window.addEventListener('message', onMessage);

    const closedCheckInterval = window.setInterval(() => {
      if (popup.closed && closeTimer === undefined) {
        // Give an already queued success/error message time to arrive after close.
        closeTimer = window.setTimeout(() => {
          finishWithError('Google sign-in was cancelled or the sign-in window was closed.');
        }, 500);
      }
    }, 500);

    const timeout = window.setTimeout(() => {
      finishWithError('OAuth авторизация заняла слишком много времени. Повторите попытку.');
    }, this.OAUTH_TIMEOUT_MS);
    unregisterDestroy = this.destroyRef.onDestroy(() => {
      isFinished = true;
      cleanup();
      popup.close();
    });
  }
  private completeGoogle(code: string, password?: string): void {
    this.setLoading(true);
    this.authService.exchangeGoogle(code, password).subscribe({
      next: () => {
        this.pendingGoogleCode.set(null);
        this.setLoading(false);
        void this.router.navigateByUrl('/home', { replaceUrl: true });
      },
      error: (error: unknown) => {
        this.setLoading(false);
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.pendingGoogleCode.set(code);
          this.serverError.set(
            'Enter your existing account password to link Google. The code expires after one minute.'
          );
        } else {
          this.pendingGoogleCode.set(null);
          this.serverError.set(
            'Google sign-in failed or expired. Please start Google sign-in again.'
          );
        }
      },
    });
  }
  cancelGoogleLink(): void {
    this.pendingGoogleCode.set(null);
    this.serverError.set(null);
  }
}
