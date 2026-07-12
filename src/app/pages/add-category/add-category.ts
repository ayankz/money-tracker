import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EntityFormShell } from '../../components/entity-form-shell/entity-form-shell';
import { Header } from '../../components/header/header';
import { CategoryService } from '../../services/category.service';
import type { CategoryType, CreateCategoryDto } from '../../types/category.types';

@Component({
  selector: 'app-add-category',
  imports: [Header, EntityFormShell, ReactiveFormsModule],
  templateUrl: './add-category.html',
  styleUrl: './add-category.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCategory {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private submittedCategoriesCount: number | null = null;

  protected readonly selectedCategoryType = signal<CategoryType>('EXPENSE');
  protected readonly isSubmitting = signal(false);
  protected readonly categoryTypes = [
    { value: 'EXPENSE', label: 'Расход' },
    { value: 'INCOME', label: 'Доход' },
  ] as const;

  protected readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    type: ['EXPENSE' as CategoryType, Validators.required],
  });
  protected readonly nameControl = this.categoryForm.controls.name as FormControl<string>;

  constructor() {
    effect(() => {
      if (this.isSubmitting()) {
        this.categoryForm.disable({ emitEvent: false });
        return;
      }

      this.categoryForm.enable({ emitEvent: false });
    });

    effect(() => {
      if (!this.isSubmitting()) {
        return;
      }

      if (this.categoryService.isLoading()) {
        return;
      }

      if (this.submittedCategoriesCount === null) {
        this.isSubmitting.set(false);
        return;
      }

      if (this.categoryService.categoriesCount() > this.submittedCategoriesCount) {
        this.resetForm();
        this.isSubmitting.set(false);
        this.closeSheet();
        return;
      }

      this.submittedCategoriesCount = null;
      this.isSubmitting.set(false);
    });
  }

  protected selectCategoryType(type: CategoryType): void {
    if (this.isSubmitting() || this.selectedCategoryType() === type) {
      return;
    }

    this.selectedCategoryType.set(type);
    this.categoryForm.patchValue({ type });
  }

  protected onSubmit(): void {
    if (this.categoryForm.invalid || this.isSubmitting()) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.categoryForm.getRawValue();
    const dto: CreateCategoryDto = {
      name: formValue.name.trim(),
      type: formValue.type,
    };

    this.submittedCategoriesCount = this.categoryService.categoriesCount();
    this.categoryService.createCategory(dto);
  }

  protected onCancel(): void {
    this.resetForm();
    this.closeSheet();
  }

  protected hasError(controlName: 'name'): boolean {
    const control = this.categoryForm.get(controlName);
    return Boolean(control?.invalid && control?.touched);
  }

  protected getErrorMessage(controlName: 'name'): string {
    const control = this.categoryForm.get(controlName);

    if (control?.hasError('required')) {
      return 'Название категории обязательно';
    }

    if (control?.hasError('minlength')) {
      return 'Минимум 2 символа';
    }

    if (control?.hasError('maxlength')) {
      return 'Максимум 50 символов';
    }

    return 'Некорректное значение';
  }

  private resetForm(): void {
    this.categoryForm.reset({
      name: '',
      type: this.selectedCategoryType(),
    });
  }

  private closeSheet(): void {
    this.router.navigate([{ outlets: { sheet: null } }], { replaceUrl: true }).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}
