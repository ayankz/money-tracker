import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { merge } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink, Header],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  serverError = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  private formEvents = toSignal(merge(this.form.statusChanges, this.form.valueChanges), {
    initialValue: null,
  });

  isValid = computed(() => {
    this.formEvents();
    return this.form.valid;
  });

  nameError = computed(() => {
    this.formEvents();
    const ctrl = this.form.controls.name;
    if (!ctrl.touched || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'Имя обязательно';
    if (ctrl.errors['minlength']) return 'Минимум 2 символа';
    return null;
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

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.serverError.set(null);

    const dto = this.form.getRawValue() as { name: string; email: string; password: string };

    this.authService.signup(dto).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.router.navigateByUrl('/home', { replaceUrl: true });
      },
      error: (err) => {
        this.serverError.set(err?.error?.message ?? 'Ошибка регистрации');
        this.isLoading.set(false);
      },
    });
  }
}
