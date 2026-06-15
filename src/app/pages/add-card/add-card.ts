import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';
import type { CreateCardDto } from '../../models/card.model';
import { CardsService } from '../../services/cards/cards';

interface CardFormValue {
  // cardName: string;
  lastDigits: string;
  balance: number;
}

@Component({
  selector: 'app-add-card',
  imports: [Header, ReactiveFormsModule],
  templateUrl: './add-card.html',
  styleUrl: './add-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCard {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cardsService = inject(CardsService);

  protected readonly isSubmitting = signal(false);

  protected readonly cardForm: FormGroup = this.fb.group({
    // cardName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastDigits: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    balance: ['', [Validators.required, Validators.pattern(/^\d+([.,]\d{0,2})?$/)]],
  });

  constructor() {
    const lastDigitsControl = this.cardForm.get('lastDigits');
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

    const balanceControl = this.cardForm.get('balance');
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
        this.cardForm.disable({ emitEvent: false });
        return;
      }

      this.cardForm.enable({ emitEvent: false });
    });

    effect(() => {
      if (!this.isSubmitting()) {
        return;
      }

      if (this.cardsService.isLoading()) {
        return;
      }

      if (this.cardsService.error()) {
        this.isSubmitting.set(false);
        return;
      }

      this.closeSheet();
    });
  }

  protected getErrorMessage(controlName: string): string {
    const control = this.cardForm.get(controlName);
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
    const control = this.cardForm.get(controlName);
    return !!(control && control.touched && control.invalid);
  }

  protected onSubmit(): void {
    if (this.cardForm.invalid || this.isSubmitting()) {
      this.cardForm.markAllAsTouched();
      return;
    }

    this.cardsService.clearError();

    const formValue = this.cardForm.getRawValue() as Omit<CardFormValue, 'balance'> & {
      balance: string;
    };
    const dto: CreateCardDto = {
      digits: formValue.lastDigits,
      balance: Number(formValue.balance),
    };

    this.cardsService.createCard(dto);
    this.isSubmitting.set(true);
  }

  protected onCancel(): void {
    if (this.cardForm.dirty) {
      const confirmLeave = confirm('У вас есть несохраненные изменения. Вы уверены, что хотите выйти?');
      if (!confirmLeave) {
        return;
      }
    }
    this.closeSheet();
  }

  private closeSheet(): void {
    this.router.navigate([{ outlets: { sheet: null } }]).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}
