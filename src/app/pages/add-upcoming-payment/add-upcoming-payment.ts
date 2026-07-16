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
import { UpcomingPaymentsService } from '../../services/upcoming-payments/upcoming-payments';
import { CategoryService } from '../../services/category.service';
import type { Category } from '../../types/category.types';
import type { CreateUpcomingPaymentDto } from '../../store/upcoming-payments.store';

type UpcomingPaymentControlName = 'title' | 'amount' | 'nextDueDate' | 'categoryId' | 'comment';
type Currency = 'KZT' | 'NZD' | 'USD';
type Frequency = 'WEEKLY' | 'MONTHLY';

interface UpcomingPaymentFormValue {
  title: string;
  amount: string;
  currency: Currency;
  frequency: Frequency;
  nextDueDate: string;
  categoryId: string;
  comment: string;
}

@Component({
  selector: 'app-add-upcoming-payment',
  imports: [Header, EntityFormShell, ReactiveFormsModule],
  templateUrl: './add-upcoming-payment.html',
  styleUrl: './add-upcoming-payment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddUpcomingPayment {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly upcomingPaymentsService = inject(UpcomingPaymentsService);
  private readonly categoryService = inject(CategoryService);
  private submittedPaymentsCount: number | null = null;

  protected readonly isSubmitting = signal(false);
  protected readonly selectedCurrency = signal<Currency>('NZD');
  protected readonly selectedFrequency = signal<Frequency>('MONTHLY');
  protected readonly selectedCategoryId = signal('');
  protected readonly isCategoryDropdownOpen = signal(false);
  protected readonly currencies = [
    { value: 'KZT', label: 'KZT' },
    { value: 'NZD', label: 'NZD' },
    { value: 'USD', label: 'USD' },
  ] as const;
  protected readonly frequencies = [
    { value: 'WEEKLY', label: 'Еженедельно' },
    { value: 'MONTHLY', label: 'Ежемесячно' },
  ] as const;

  protected readonly categories = this.categoryService.categories;
  protected readonly expenseCategories = computed<ReadonlyArray<Category>>(() =>
    this.categories().filter((category) => category.type === 'EXPENSE')
  );
  protected readonly selectedCategoryLabel = computed(() => {
    const selectedId = this.selectedCategoryId();

    if (!selectedId) {
      return 'Выберите категорию';
    }

    return this.expenseCategories().find((category) => category.id === selectedId)?.name ?? 'Выберите категорию';
  });

  protected readonly paymentForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    amount: ['', [Validators.required, Validators.min(0.1), Validators.pattern(/^\d+([.,]\d{0,2})?$/)]],
    currency: ['NZD' as Currency, Validators.required],
    frequency: ['MONTHLY' as Frequency, Validators.required],
    nextDueDate: ['', [Validators.required, this.validDueDateValidator()]],
    categoryId: ['', Validators.required],
    comment: ['', Validators.maxLength(255)],
  });

  protected readonly titleControl = this.paymentForm.controls.title as FormControl<string>;
  protected readonly amountControl = this.paymentForm.controls.amount as FormControl<string>;
  protected readonly nextDueDateControl = this.paymentForm.controls.nextDueDate as FormControl<string>;
  protected readonly categoryIdControl = this.paymentForm.controls.categoryId as FormControl<string>;
  protected readonly commentControl = this.paymentForm.controls.comment as FormControl<string>;

  constructor() {
    if (!this.categoryService.hasCategories() && !this.categoryService.isLoading()) {
      this.categoryService.loadCategories();
    }

    this.amountControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.normalizeAmount(value));

    this.nextDueDateControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.normalizeDate(value));

    this.categoryIdControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.selectedCategoryId.set(value ?? ''));

    effect(() => {
      if (this.isSubmitting()) {
        this.paymentForm.disable({ emitEvent: false });
        return;
      }

      this.paymentForm.enable({ emitEvent: false });
    });

    effect(() => {
      if (!this.isSubmitting()) {
        return;
      }

      if (this.upcomingPaymentsService.isLoading()) {
        return;
      }

      if (this.submittedPaymentsCount === null) {
        this.isSubmitting.set(false);
        return;
      }

      if (this.upcomingPaymentsService.paymentsCount() > this.submittedPaymentsCount) {
        this.resetForm();
        this.isSubmitting.set(false);
        this.closeSheet();
        return;
      }

      this.submittedPaymentsCount = null;
      this.isSubmitting.set(false);
    });
  }

  protected selectCurrency(currency: Currency): void {
    if (this.isSubmitting() || this.selectedCurrency() === currency) {
      return;
    }

    this.selectedCurrency.set(currency);
    this.paymentForm.patchValue({ currency });
  }

  protected selectFrequency(frequency: Frequency): void {
    if (this.isSubmitting() || this.selectedFrequency() === frequency) {
      return;
    }

    this.selectedFrequency.set(frequency);
    this.paymentForm.patchValue({ frequency });
  }

  protected toggleCategoryDropdown(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isCategoryDropdownOpen.update((value) => !value);
  }

  protected selectCategory(categoryId: string): void {
    this.categoryIdControl.setValue(categoryId);
    this.selectedCategoryId.set(categoryId);
    this.isCategoryDropdownOpen.set(false);
  }

  protected hasError(controlName: UpcomingPaymentControlName): boolean {
    const control = this.paymentForm.get(controlName);
    return Boolean(control?.invalid && control?.touched);
  }

  protected getErrorMessage(controlName: UpcomingPaymentControlName): string {
    const control = this.paymentForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Это поле обязательно';
    }

    if (control?.hasError('minlength')) {
      return `Минимум ${control.errors?.['minlength'].requiredLength} символа`;
    }

    if (control?.hasError('maxlength')) {
      return `Максимум ${control.errors?.['maxlength'].requiredLength} символов`;
    }

    if (control?.hasError('min')) {
      return 'Минимальная сумма 0.1';
    }

    if (control?.hasError('pattern')) {
      return 'Введите корректную сумму';
    }

    if (control?.hasError('dateFormat')) {
      return 'Введите дату в формате YYYY-MM-DD';
    }

    if (control?.hasError('invalidDate')) {
      return 'Введите существующую дату';
    }

    if (control?.hasError('pastDate')) {
      return 'Дата не может быть в прошлом';
    }

    return 'Некорректное значение';
  }

  protected blockNegativeAmountInput(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === 'Minus') {
      event.preventDefault();
    }
  }

  protected onSubmit(): void {
    if (this.paymentForm.invalid || this.isSubmitting()) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const formValue = this.paymentForm.getRawValue() as UpcomingPaymentFormValue;
    const dto: CreateUpcomingPaymentDto = {
      title: formValue.title.trim(),
      amount: Number(formValue.amount),
      currency: formValue.currency,
      frequency: formValue.frequency,
      nextDueDate: new Date(`${formValue.nextDueDate}T00:00:00.000`).toISOString(),
      categoryId: Number(formValue.categoryId),
      comment: formValue.comment.trim() || undefined,
      isActive: true,
    };

    this.submittedPaymentsCount = this.upcomingPaymentsService.paymentsCount();
    this.upcomingPaymentsService.createPayment(dto);
    this.isSubmitting.set(true);
  }

  protected onCancel(): void {
    this.resetForm();
    this.closeSheet();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.entity-dropdown')) {
      this.isCategoryDropdownOpen.set(false);
    }
  }

  private normalizeAmount(value: string): void {
    const sanitized = String(value ?? '')
      .replace(',', '.')
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1');

    const [whole = '', fraction = ''] = sanitized.split('.');
    const normalized = sanitized.includes('.') ? `${whole}.${fraction.substring(0, 2)}` : whole;

    if (normalized !== value) {
      this.amountControl.patchValue(normalized, { emitEvent: false });
    }
  }

  private normalizeDate(value: string): void {
    const digits = String(value ?? '')
      .replace(/\D/g, '')
      .substring(0, 8);
    const year = digits.substring(0, 4);
    const month = digits.substring(4, 6);
    const day = digits.substring(6, 8);
    const normalized = [year, month, day].filter(Boolean).join('-');

    if (normalized !== value) {
      this.nextDueDateControl.patchValue(normalized, { emitEvent: false });
    }
  }

  private validDueDateValidator(): ValidatorFn {
    return (control: AbstractControl<string>): ValidationErrors | null => {
      const value = String(control.value ?? '');

      if (!value) {
        return null;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return { dateFormat: true };
      }

      const [yearRaw, monthRaw, dayRaw] = value.split('-');
      const year = Number(yearRaw);
      const month = Number(monthRaw);
      const day = Number(dayRaw);

      if (month < 1 || month > 12 || day < 1 || day > 31) {
        return { invalidDate: true };
      }

      const date = new Date(year, month - 1, day);
      const isValidDate = date.getFullYear() === year
        && date.getMonth() === month - 1
        && date.getDate() === day;

      if (!isValidDate) {
        return { invalidDate: true };
      }

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (date < startOfToday) {
        return { pastDate: true };
      }

      return null;
    };
  }

  private resetForm(): void {
    this.paymentForm.reset({
      title: '',
      amount: '',
      currency: this.selectedCurrency(),
      frequency: this.selectedFrequency(),
      nextDueDate: '',
      categoryId: '',
      comment: '',
    });
    this.selectedCategoryId.set('');
  }

  private closeSheet(): void {
    this.submittedPaymentsCount = null;
    this.router.navigate([{ outlets: { sheet: null } }], { replaceUrl: true }).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}
