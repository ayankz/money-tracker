import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs/operators';
import { Header } from '../../components/header/header';
import { ColorPicker } from '../../components/color-picker/color-picker';
import { CardTypeSelector, type CardType } from '../../components/card-type-selector/card-type-selector';

interface CardFormValue {
  cardName: string;
  lastDigits: string;
  color: string;
  type: CardType;
}

@Component({
  selector: 'app-add-card',
  imports: [Header, ReactiveFormsModule, ColorPicker, CardTypeSelector],
  templateUrl: './add-card.html',
  styleUrl: './add-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCard {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly isSubmitting = signal(false);

  protected readonly cardForm: FormGroup = this.fb.group({
    cardName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastDigits: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    color: ['#ffdce3', Validators.required],
    type: ['credit' as CardType, Validators.required],
  });

  protected readonly isFormValid = computed(() => {
    return this.cardForm.valid && !this.isSubmitting();
  });

  // Convert form value changes to signals
  protected readonly selectedColor = toSignal(
    this.cardForm.get('color')!.valueChanges.pipe(
      startWith(this.cardForm.get('color')!.value),
      map(value => value || '#ffdce3')
    ),
    { initialValue: '#ffdce3' }
  );

  protected readonly selectedType = toSignal(
    this.cardForm.get('type')!.valueChanges.pipe(
      startWith(this.cardForm.get('type')!.value),
      map(value => value || 'credit')
    ),
    { initialValue: 'credit' as CardType }
  );

  protected onColorSelected(color: string): void {
    this.cardForm.patchValue({ color });
  }

  protected onTypeSelected(type: CardType): void {
    this.cardForm.patchValue({ type });
  }

  protected onLastDigitsInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').substring(0, 4);
    this.cardForm.patchValue({ lastDigits: value });
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
      return 'Введите 4 цифры';
    }

    return 'Некорректное значение';
  }

  protected hasError(controlName: string): boolean {
    const control = this.cardForm.get(controlName);
    return !!(control && control.touched && control.invalid);
  }

  protected async onSubmit(): Promise<void> {
    if (this.cardForm.invalid || this.isSubmitting()) {
      this.cardForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formValue = this.cardForm.value as CardFormValue;
      console.log('Card added:', formValue);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // TODO: Save card data to service/store

      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Failed to add card:', error);
      // TODO: Show error notification to user
      this.isSubmitting.set(false);
    }
  }

  protected onCancel(): void {
    if (this.cardForm.dirty) {
      const confirmLeave = confirm('У вас есть несохраненные изменения. Вы уверены, что хотите выйти?');
      if (!confirmLeave) {
        return;
      }
    }
    this.router.navigate(['/home']);
  }
}
