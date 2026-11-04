import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EntityFormShell } from '../../components/entity-form-shell/entity-form-shell';
import { Header } from '../../components/header/header';
import { AccountsService } from '../../services/accounts/accounts';
import { CategoryService } from '../../services/category.service';
import { NetworkStatusService } from '../../services/network-status/network-status';
import { NotificationsService } from '../../services/notifications/notifications';
import { OperationsService } from '../../services/operations/operations';
import type { Account } from '../../models/account.model';
import type { Category } from '../../types/category.types';
import type { CreateOperationDto, OperationType } from '../../store/operations.store';

interface TransactionFormValue {
  type: OperationType;
  amount: string;
  categoryId: string;
  comment: string;
  accountId: string;
}

@Component({
  selector: 'app-add-transaction',
  imports: [Header, EntityFormShell, ReactiveFormsModule],
  templateUrl: './add-transaction.html',
  styleUrl: './add-transaction.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTransaction {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly accountsService = inject(AccountsService);
  private readonly categoryService = inject(CategoryService);
  private readonly operationsService = inject(OperationsService);
  private readonly networkStatusService = inject(NetworkStatusService);
  private readonly notifications = inject(NotificationsService);
  private submittedOperationsCount: number | null = null;

  protected readonly isSubmitting = signal(false);
  protected readonly isOnline = this.networkStatusService.isOnline;
  protected readonly selectedType = signal<OperationType>('EXPENSE');
  protected readonly operationTypes = [
    { value: 'EXPENSE', label: 'Расход' },
    { value: 'INCOME', label: 'Доход' },
  ] as const;

  protected readonly transactionForm = this.fb.nonNullable.group({
    type: ['EXPENSE' as OperationType, Validators.required],
    amount: ['', [Validators.required, Validators.pattern(/^\d+([.,]\d{0,2})?$/)]],
    categoryId: [''],
    comment: ['', Validators.maxLength(255)],
    accountId: [''],
  });

  protected readonly amountControl = this.transactionForm.controls.amount as FormControl<string>;
  protected readonly categoryIdControl = this.transactionForm.controls.categoryId as FormControl<string>;
  protected readonly commentControl = this.transactionForm.controls.comment as FormControl<string>;
  protected readonly accountIdControl = this.transactionForm.controls.accountId as FormControl<string>;
  protected readonly selectedAccountId = signal('');
  protected readonly selectedCategoryId = signal('');

  protected readonly accounts = this.accountsService.accounts;
  protected readonly categories = this.categoryService.categories;
  protected readonly filteredCategories = computed<ReadonlyArray<Category>>(() =>
    this.categories().filter((category) => category.type === this.selectedType())
  );
  protected readonly hasAccounts = this.accountsService.hasAccounts;
  protected readonly hasCategories = computed(() => this.filteredCategories().length > 0);
  protected readonly isAccountDropdownOpen = signal(false);
  protected readonly isCategoryDropdownOpen = signal(false);
  protected readonly selectedAccountLabel = computed(() => {
    const selectedId = this.selectedAccountId();

    if (!selectedId) {
      return 'Без аккаунта';
    }

    const account = this.accounts().find((item) => String(item.id) === selectedId);
    return account ? this.getAccountLabel(account) : 'Без аккаунта';
  });
  protected readonly selectedAccountCurrency = computed(() => {
    const selectedId = this.selectedAccountId();

    if (!selectedId) {
      return '';
    }

    return this.accounts().find((item) => String(item.id) === selectedId)?.currency ?? '';
  });
  protected readonly selectedCategoryLabel = computed(() => {
    const selectedId = this.selectedCategoryId();

    if (!selectedId) {
      return 'Без категории';
    }

    const category = this.filteredCategories().find((item) => item.id === selectedId);
    return category?.name ?? 'Без категории';
  });

  constructor() {
    if (!this.accountsService.hasLoaded() && !this.accountsService.isLoading()) {
      this.accountsService.loadAccounts();
    }

    if (!this.categoryService.hasCategories() && !this.categoryService.isLoading()) {
      this.categoryService.loadCategories();
    }

    this.amountControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        const sanitized = String(value ?? '')
          .replace(',', '.')
          .replace(/[^\d.]/g, '')
          .replace(/(\..*)\./g, '$1');

        const [whole = '', fraction = ''] = sanitized.split('.');
        const normalized = sanitized.includes('.') ? `${whole}.${fraction.substring(0, 2)}` : whole;

        if (normalized !== value) {
          this.amountControl.patchValue(normalized, { emitEvent: false });
        }
      });

    this.accountIdControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.selectedAccountId.set(value ?? '');
      });

    this.categoryIdControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.selectedCategoryId.set(value ?? '');
      });

    effect(() => {
      if (this.isSubmitting()) {
        this.transactionForm.disable({ emitEvent: false });
        return;
      }

      this.transactionForm.enable({ emitEvent: false });
    });

    effect(() => {
      if (!this.isSubmitting()) {
        return;
      }

      if (this.operationsService.isLoading()) {
        return;
      }

      if (this.submittedOperationsCount === null) {
        this.isSubmitting.set(false);
        return;
      }

      if (this.operationsService.operationsCount() > this.submittedOperationsCount) {
        this.accountsService.loadAccounts();
        this.operationsService.loadOverview();
        this.resetForm();
        this.isSubmitting.set(false);
        this.closeSheet();
        return;
      }

      this.submittedOperationsCount = null;
      this.isSubmitting.set(false);
    });
  }

  protected selectType(type: OperationType): void {
    if (this.isSubmitting() || this.selectedType() === type) {
      return;
    }

    this.selectedType.set(type);
    this.transactionForm.patchValue({
      type,
      categoryId: '',
    });
    this.selectedCategoryId.set('');
    this.isCategoryDropdownOpen.set(false);
  }

  protected hasError(controlName: 'amount' | 'comment'): boolean {
    const control = this.transactionForm.get(controlName);
    return Boolean(control?.touched && control.invalid);
  }

  protected getErrorMessage(controlName: 'amount' | 'comment'): string {
    const control = this.transactionForm.get(controlName);

    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Это поле обязательно';
    }

    if (control.errors['pattern']) {
      return 'Введите корректную сумму';
    }

    if (control.errors['maxlength']) {
      return `Максимум ${control.errors['maxlength'].requiredLength} символов`;
    }

    return 'Некорректное значение';
  }

  protected getAccountLabel(account: Account): string {
    if (account.type === 'CARD' && account.cardName) {
      return `${account.cardName} (${account.digits})`;
    }

    return account.name;
  }

  protected asString(value: string | number): string {
    return String(value);
  }

  protected toggleAccountDropdown(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isCategoryDropdownOpen.set(false);
    this.isAccountDropdownOpen.update((value) => !value);
  }

  protected toggleCategoryDropdown(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isAccountDropdownOpen.set(false);
    this.isCategoryDropdownOpen.update((value) => !value);
  }

  protected selectAccount(accountId: string): void {
    this.accountIdControl.setValue(accountId);
    this.selectedAccountId.set(accountId);
    this.isAccountDropdownOpen.set(false);
  }

  protected selectCategory(categoryId: string): void {
    this.categoryIdControl.setValue(categoryId);
    this.selectedCategoryId.set(categoryId);
    this.isCategoryDropdownOpen.set(false);
  }

  protected onSubmit(): void {
    if (!this.isOnline()) {
      this.notifications.error('Нет подключения к интернету');
      return;
    }

    if (this.transactionForm.invalid || this.isSubmitting()) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.transactionForm.getRawValue() as TransactionFormValue;
    const dto: CreateOperationDto = {
      type: formValue.type,
      amount: Number(formValue.amount),
      categoryId: formValue.categoryId ? Number(formValue.categoryId) : undefined,
      comment: formValue.comment.trim() || undefined,
      accountId: formValue.accountId ? Number(formValue.accountId) : undefined,
    };

    this.submittedOperationsCount = this.operationsService.operationsCount();
    this.operationsService.createOperation(dto);
  }

  protected onCancel(): void {
    this.resetForm();
    this.closeSheet();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.entity-dropdown')) {
      this.isAccountDropdownOpen.set(false);
      this.isCategoryDropdownOpen.set(false);
    }
  }

  private resetForm(): void {
    this.transactionForm.reset({
      type: this.selectedType(),
      amount: '',
      categoryId: '',
      comment: '',
      accountId: '',
    });
    this.selectedAccountId.set('');
    this.selectedCategoryId.set('');
  }

  private closeSheet(): void {
    this.router.navigate([{ outlets: { sheet: null } }], { replaceUrl: true }).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}
