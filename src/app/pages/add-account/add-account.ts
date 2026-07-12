import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EntityFormShell } from '../../components/entity-form-shell/entity-form-shell';
import { Header } from '../../components/header/header';
import type { CreateAccountDto } from '../../models/account.model';
import { AccountsService } from '../../services/accounts/accounts';

interface AccountFormValue {
  name: string;
  type: string;
  currency: string;
  cardName: string;
  lastDigits: string;
  balance: number;
}

@Component({
  selector: 'app-add-account',
  imports: [Header, EntityFormShell, ReactiveFormsModule],
  templateUrl: './add-account.html',
  styleUrl: './add-account.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAccount {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly accountsService = inject(AccountsService);

  protected readonly isSubmitting = signal(false);
  protected readonly selectedAccountType = signal<'CARD' | 'CASH'>('CARD');
  protected readonly selectedCurrency = signal<'KZT' | 'NZD' | 'USD'>('KZT');
  private submittedAccountsCount: number | null = null;
  protected readonly accountTypes = [
    { value: 'CASH', label: 'Наличка' },
    { value: 'CARD', label: 'Карта' },
  ] as const;
  protected readonly currencies = [
    { value: 'KZT', label: 'KZT' },
    { value: 'NZD', label: 'NZD' },
    { value: 'USD', label: 'USD' },
  ] as const;
  protected readonly isCardAccount = computed(() => this.selectedAccountType() === 'CARD');

  protected readonly accountForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    type: ['CARD', [Validators.required]],
    currency: ['KZT', [Validators.required]],
    cardName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastDigits: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    balance: ['', [Validators.required, Validators.pattern(/^\d+([.,]\d{0,2})?$/)]],
  });
  protected readonly nameControl = this.accountForm.get('name') as FormControl<string>;
  protected readonly cardNameControl = this.accountForm.get('cardName') as FormControl<string>;
  protected readonly lastDigitsControl = this.accountForm.get('lastDigits') as FormControl<string>;
  protected readonly balanceControl = this.accountForm.get('balance') as FormControl<string>;

  constructor() {
    const typeControl = this.accountForm.get('type');
    const cardNameControl = this.accountForm.get('cardName');
    const lastDigitsControl = this.accountForm.get('lastDigits');
    const cardValidators = [Validators.required, Validators.minLength(2), Validators.maxLength(50)];

    typeControl?.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        const normalizedType = value === 'CASH' ? 'CASH' : 'CARD';
        this.selectedAccountType.set(normalizedType);

        if (normalizedType === 'CARD') {
          cardNameControl?.setValidators(cardValidators);
          lastDigitsControl?.setValidators([Validators.required, Validators.pattern(/^\d{4}$/)]);
        } else {
          cardNameControl?.clearValidators();
          lastDigitsControl?.clearValidators();
          cardNameControl?.patchValue('', { emitEvent: false });
          lastDigitsControl?.patchValue('', { emitEvent: false });
        }

        cardNameControl?.updateValueAndValidity({ emitEvent: false });
        lastDigitsControl?.updateValueAndValidity({ emitEvent: false });
      });

    this.accountForm.get('currency')?.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        const normalizedCurrency = value === 'NZD' || value === 'USD' ? value : 'KZT';
        this.selectedCurrency.set(normalizedCurrency);
      });

    lastDigitsControl?.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        const normalized = String(value ?? '')
          .replace(/\D/g, '')
          .substring(0, 4);

        if (normalized !== value) {
          lastDigitsControl.patchValue(normalized, { emitEvent: false });
        }
      });

    const balanceControl = this.accountForm.get('balance');
    balanceControl?.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        const sanitized = String(value ?? '')
          .replace(',', '.')
          .replace(/[^\d.]/g, '')
          .replace(/(\..*)\./g, '$1');

        const [whole = '', fraction = ''] = sanitized.split('.');
        const normalized = fraction ? `${whole}.${fraction.substring(0, 2)}` : whole;

        if (normalized !== value) {
          balanceControl.patchValue(normalized, { emitEvent: false });
        }
      });

    effect(() => {
      if (this.isSubmitting()) {
        this.accountForm.disable({ emitEvent: false });
        return;
      }

      this.accountForm.enable({ emitEvent: false });
    });

    effect(() => {
      if (!this.isSubmitting()) {
        return;
      }

      if (this.accountsService.isLoading()) {
        return;
      }

      if (this.submittedAccountsCount === null) {
        this.isSubmitting.set(false);
        return;
      }

      if (this.accountsService.accountsCount() > this.submittedAccountsCount) {
        this.closeSheet();
        return;
      }

      this.submittedAccountsCount = null;
      this.isSubmitting.set(false);
    });
  }

  protected getErrorMessage(controlName: string): string {
    const control = this.accountForm.get(controlName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Это поле обязательно';
    }
    if (control.errors['minlength']) {
      return `Минимум ${control.errors['minlength'].requiredLength} символов`;
    }
    if (control.errors['maxlength']) {
      return `Максимум ${control.errors['maxlength'].requiredLength} символов`;
    }
    if (control.errors['pattern']) {
      if (controlName === 'lastDigits') {
        return 'Введите 4 цифры';
      }

      if (controlName === 'balance') {
        return 'Введите корректную сумму';
      }
    }

    return 'Некорректное значение';
  }

  protected hasError(controlName: string): boolean {
    const control = this.accountForm.get(controlName);
    return !!(control && control.touched && control.invalid);
  }

  protected selectAccountType(type: 'CARD' | 'CASH'): void {
    if (this.isSubmitting() || this.selectedAccountType() === type) {
      return;
    }

    this.accountForm.get('type')?.setValue(type);
  }

  protected selectCurrency(currency: 'KZT' | 'NZD' | 'USD'): void {
    if (this.isSubmitting() || this.selectedCurrency() === currency) {
      return;
    }

    this.accountForm.get('currency')?.setValue(currency);
  }

  protected onSubmit(): void {
    if (this.accountForm.invalid || this.isSubmitting()) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const formValue = this.accountForm.getRawValue() as Omit<AccountFormValue, 'balance'> & {
      balance: string;
    };
    const dto: CreateAccountDto = this.isCardAccount()
      ? {
        name: formValue.name.trim(),
        type: formValue.type,
        currency: formValue.currency,
        balance: Number(formValue.balance),
        cardName: formValue.cardName.trim(),
        digits: formValue.lastDigits,
      }
      : {
        name: formValue.name.trim(),
        type: formValue.type,
        currency: formValue.currency,
        balance: Number(formValue.balance),
      };

    this.submittedAccountsCount = this.accountsService.accountsCount();
    this.accountsService.createAccount(dto);
    this.isSubmitting.set(true);
  }

  protected onCancel(): void {
    if (this.accountForm.dirty) {
      const confirmLeave = confirm('У вас есть несохраненные изменения. Вы уверены, что хотите выйти?');
      if (!confirmLeave) {
        return;
      }
    }
    this.closeSheet();
  }

  private closeSheet(): void {
    this.submittedAccountsCount = null;
    this.router.navigate([{ outlets: { sheet: null } }], { replaceUrl: true }).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}
