import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { EntityFormShell } from '../../components/entity-form-shell/entity-form-shell';
import { Header } from '../../components/header/header';
import type { Account } from '../../models/account.model';
import { AccountsService } from '../../services/accounts/accounts';
import { NetworkStatusService } from '../../services/network-status/network-status';
import { NotificationsService } from '../../services/notifications/notifications';
import { TransfersService } from '../../services/transfers/transfers';
import type { CreateTransferDto } from '../../store/transfers.store';

type TransferControlName = 'fromAccountId' | 'toAccountId' | 'withdrawAmount' | 'depositAmount' | 'comment';

interface TransferFormValue {
  fromAccountId: number | null;
  toAccountId: number | null;
  withdrawAmount: string;
  depositAmount: string;
  comment: string;
}

@Component({
  selector: 'app-create-transfer',
  imports: [Header, EntityFormShell, ReactiveFormsModule],
  templateUrl: './create-transfer.html',
  styleUrl: './create-transfer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTransfer {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly accountsService = inject(AccountsService);
  private readonly transfersService = inject(TransfersService);
  private readonly networkStatusService = inject(NetworkStatusService);
  private readonly notifications = inject(NotificationsService);
  private submittedTransfersCount: number | null = null;
  private isSyncingEqualCurrencyAmounts = false;

  protected readonly isSubmitting = signal(false);
  protected readonly isOnline = this.networkStatusService.isOnline;
  protected readonly selectedFromAccountId = signal<number | null>(null);
  protected readonly selectedToAccountId = signal<number | null>(null);
  protected readonly accounts = computed<ReadonlyArray<Account>>(() => this.accountsService.accounts());
  protected readonly fromCurrency = computed(() => this.getSelectedAccountCurrency(this.selectedFromAccountId()));
  protected readonly toCurrency = computed(() => this.getSelectedAccountCurrency(this.selectedToAccountId()));
  protected readonly transferForm = this.fb.nonNullable.group({
    fromAccountId: this.fb.control<number | null>(null, Validators.required),
    toAccountId: this.fb.control<number | null>(null, Validators.required),
    withdrawAmount: [
      '',
      [
        Validators.required,
        Validators.min(0.1),
        Validators.pattern(/^\d+([.,]\d{0,2})?$/),
        this.maxFromBalanceValidator(),
      ],
    ],
    depositAmount: ['', [Validators.required, Validators.min(0.1), Validators.pattern(/^\d+([.,]\d{0,2})?$/)]],
    comment: ['', Validators.maxLength(255)],
  });
  protected readonly fromAccountIdControl = this.transferForm.controls.fromAccountId as FormControl<number | null>;
  protected readonly toAccountIdControl = this.transferForm.controls.toAccountId as FormControl<number | null>;
  protected readonly withdrawAmountControl = this.transferForm.controls.withdrawAmount as FormControl<string>;
  protected readonly depositAmountControl = this.transferForm.controls.depositAmount as FormControl<string>;
  protected readonly commentControl = this.transferForm.controls.comment as FormControl<string>;

  constructor() {
    if (!this.accountsService.hasLoaded() && !this.accountsService.isLoading()) {
      void this.accountsService.loadAccounts();
    }

    this.withdrawAmountControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.normalizeAmount(this.withdrawAmountControl, value);
        this.syncDepositAmountForEqualCurrencies(this.withdrawAmountControl.value);
      });

    this.depositAmountControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.normalizeAmount(this.depositAmountControl, value));

    effect(() => {
      if (this.isSubmitting()) {
        this.transferForm.disable({ emitEvent: false });
        return;
      }

      this.transferForm.enable({ emitEvent: false });
    });

    effect(() => {
      if (this.selectedFromAccountId() !== null) {
        return;
      }

      const [firstAccount] = this.accounts();
      if (!firstAccount) {
        return;
      }

      this.selectFromAccount(firstAccount.id);
    });

    effect(() => {
      this.accounts();
      this.selectedFromAccountId();
      this.withdrawAmountControl.updateValueAndValidity({ emitEvent: false });
      this.syncDepositAmountForEqualCurrencies(this.withdrawAmountControl.value);
    });

    effect(() => {
      if (this.selectedToAccountId() !== null) {
        return;
      }

      const toAccount = this.accounts().find((account) => account.id !== this.selectedFromAccountId());
      if (!toAccount) {
        return;
      }

      this.selectToAccount(toAccount.id);
    });

    effect(() => {
      if (!this.isSubmitting()) {
        return;
      }

      if (this.transfersService.isLoading()) {
        return;
      }

      if (this.submittedTransfersCount === null) {
        this.isSubmitting.set(false);
        return;
      }

      if (this.transfersService.transfersCount() > this.submittedTransfersCount) {
        this.accountsService.loadAccounts();
        this.resetForm();
        this.isSubmitting.set(false);
        this.closeSheet();
        return;
      }

      this.submittedTransfersCount = null;
      this.isSubmitting.set(false);
    });
  }

  protected onSubmit(): void {
    if (!this.isOnline()) {
      this.notifications.error('Нет подключения к интернету');
      return;
    }

    if (this.transferForm.invalid || this.isSubmitting()) {
      this.transferForm.markAllAsTouched();
      return;
    }

    const formValue = this.transferForm.getRawValue() as TransferFormValue;
    const dto: CreateTransferDto = {
      fromAccountId: Number(formValue.fromAccountId),
      toAccountId: Number(formValue.toAccountId),
      debitAmount: Number(formValue.withdrawAmount),
      creditAmount: Number(formValue.depositAmount),
      comment: formValue.comment.trim() || undefined,
    };

    this.submittedTransfersCount = this.transfersService.transfersCount();
    this.transfersService.createTransfer(dto);
    this.isSubmitting.set(true);
  }

  protected onCancel(): void {
    this.resetForm();
    this.closeSheet();
  }

  protected hasError(controlName: TransferControlName): boolean {
    const control = this.transferForm.get(controlName);
    return Boolean(control?.invalid && control?.touched);
  }

  protected getErrorMessage(controlName: TransferControlName): string {
    const control = this.transferForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Сумма обязательна';
    }

    if (control?.hasError('pattern')) {
      return 'Введите корректную сумму';
    }

    if (control?.hasError('min')) {
      return 'Минимальная сумма 0.1';
    }

    if (control?.hasError('maxBalance')) {
      const error = control.errors?.['maxBalance'] as { max: number; currency: string };
      return `Недостаточно средств. Максимум ${this.formatAmount(error.max, error.currency)}`;
    }

    if (control?.hasError('maxlength')) {
      return `Максимум ${control.errors?.['maxlength'].requiredLength} символов`;
    }

    return 'Некорректное значение';
  }

  protected blockNegativeAmountInput(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === 'Minus') {
      event.preventDefault();
    }
  }

  protected selectFromAccount(accountId: number): void {
    if (this.isSubmitting() || this.selectedFromAccountId() === accountId) {
      return;
    }

    this.selectedFromAccountId.set(accountId);
    this.fromAccountIdControl.setValue(accountId);
    this.fromAccountIdControl.markAsTouched();
    this.withdrawAmountControl.updateValueAndValidity({ emitEvent: false });

    if (this.selectedToAccountId() === accountId) {
      const nextToAccount = this.accounts().find((account) => account.id !== accountId);
      this.selectedToAccountId.set(null);
      this.toAccountIdControl.setValue(null);

      if (nextToAccount) {
        this.selectToAccount(nextToAccount.id);
      }
    }
  }

  protected selectToAccount(accountId: number): void {
    if (this.isSubmitting() || this.selectedToAccountId() === accountId || this.selectedFromAccountId() === accountId) {
      return;
    }

    this.selectedToAccountId.set(accountId);
    this.toAccountIdControl.setValue(accountId);
    this.toAccountIdControl.markAsTouched();
    this.syncDepositAmountForEqualCurrencies(this.withdrawAmountControl.value);
  }

  protected isToAccountDisabled(accountId: number): boolean {
    return this.isSubmitting() || this.selectedFromAccountId() === accountId;
  }

  protected getAccountTitle(account: Account): string {
    return account.cardName?.trim() || account.name || 'Account';
  }

  protected getAccountTypeLabel(account: Account): string {
    return account.type === 'CARD' ? 'Карта' : 'Наличка';
  }

  protected formatAccountBalance(account: Account): string {
    const currency = account.currency || 'KZT';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(account.balance));
  }

  private getSelectedAccountCurrency(accountId: number | null): string {
    if (accountId === null) {
      return '';
    }

    return this.accounts().find((account) => account.id === accountId)?.currency ?? '';
  }

  private normalizeAmount(control: FormControl<string>, value: string): void {
    const sanitized = String(value ?? '')
      .replace(',', '.')
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1');

    const [whole = '', fraction = ''] = sanitized.split('.');
    const normalized = sanitized.includes('.') ? `${whole}.${fraction.substring(0, 2)}` : whole;

    if (normalized !== value) {
      control.patchValue(normalized, { emitEvent: false });
    }
  }

  private syncDepositAmountForEqualCurrencies(value: string): void {
    if (this.isSyncingEqualCurrencyAmounts || this.fromCurrency() !== this.toCurrency()) {
      return;
    }

    this.isSyncingEqualCurrencyAmounts = true;
    this.depositAmountControl.patchValue(value, { emitEvent: false });
    this.depositAmountControl.markAsTouched();
    this.depositAmountControl.updateValueAndValidity({ emitEvent: false });
    this.isSyncingEqualCurrencyAmounts = false;
  }

  private maxFromBalanceValidator(): ValidatorFn {
    return (control: AbstractControl<string>): ValidationErrors | null => {
      const amount = Number(control.value);
      if (!Number.isFinite(amount)) {
        return null;
      }

      const accountId = this.selectedFromAccountId();
      if (accountId === null) {
        return null;
      }

      const account = this.accounts().find((item) => item.id === accountId);
      if (!account) {
        return null;
      }

      const maxBalance = Number(account.balance);
      if (!Number.isFinite(maxBalance) || amount <= maxBalance) {
        return null;
      }

      return {
        maxBalance: {
          max: maxBalance,
          currency: account.currency || 'KZT',
        },
      };
    };
  }

  private formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'KZT',
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private resetForm(): void {
    this.transferForm.reset({
      fromAccountId: this.selectedFromAccountId(),
      toAccountId: this.selectedToAccountId(),
      withdrawAmount: '',
      depositAmount: '',
      comment: '',
    });
  }

  private closeSheet(): void {
    this.submittedTransfersCount = null;
    this.router.navigate([{ outlets: { sheet: null } }], { replaceUrl: true }).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}
