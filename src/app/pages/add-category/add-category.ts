import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, map } from 'rxjs';
import { Header } from '../../components/header/header';
import { SearchField } from '../../components/search-field/search-field';
import { ColorPicker } from '../../components/color-picker/color-picker';
import { IconPicker } from '../../components/icon-picker/icon-picker';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../types/category.types';

@Component({
  selector: 'app-add-category',
  imports: [Header, SearchField, ColorPicker, IconPicker, ReactiveFormsModule],
  templateUrl: './add-category.html',
  styleUrl: './add-category.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCategory {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Outputs
  public readonly categorySelected = output<Category>();
  public readonly categoryCreated = output<Category>();

  // State
  protected readonly searchQuery = signal('');
  protected readonly allCategories = this.categoryService.getCategories();
  protected readonly isSubmitting = signal(false);

  // Form
  protected readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    backgroundColor: ['#ffdce3', Validators.required],
    iconId: ['home', Validators.required],
  });

  // Signals from form for reactive UI
  protected readonly selectedColor = toSignal(
    this.categoryForm.get('backgroundColor')!.valueChanges.pipe(
      startWith(this.categoryForm.get('backgroundColor')!.value),
      map((value) => value || '#ffdce3')
    ),
    { initialValue: '#ffdce3' }
  );

  protected readonly selectedIcon = toSignal(
    this.categoryForm.get('iconId')!.valueChanges.pipe(
      startWith(this.categoryForm.get('iconId')!.value),
      map((value) => value || 'home')
    ),
    { initialValue: 'home' }
  );

  // Computed
  protected readonly filteredCategories = computed(() => {
    return this.categoryService.searchCategories(this.searchQuery());
  });

  protected readonly hasResults = computed(() => {
    return this.filteredCategories().length > 0;
  });

  protected readonly isFormValid = computed(() => {
    return this.categoryForm.valid;
  });

  // Event handlers
  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected onCategorySelect(category: Category): void {
    this.categorySelected.emit(category);
    this.router.navigate(['/home']).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }

  protected onViewAll(): void {
    this.router.navigate(['/categories']).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }

  protected onColorSelect(color: string): void {
    this.categoryForm.patchValue({ backgroundColor: color });
  }

  protected onIconSelect(iconId: string): void {
    this.categoryForm.patchValue({ iconId });
  }

  protected onSubmit(): void {
    if (this.categoryForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.categoryForm.getRawValue();

    // TODO: Get icon path from IconPicker service
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: formValue.name,
      backgroundColor: formValue.backgroundColor,
      iconPath: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', // Placeholder
      iconColor: '#994ce6',
    };

    this.categoryCreated.emit(newCategory);
    this.categoryForm.reset();
    this.isSubmitting.set(false);

    this.router.navigate(['/home']).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }

  protected onCancel(): void {
    this.categoryForm.reset();
    this.router.navigate(['/home']).catch((error) => {
      console.error('Navigation failed:', error);
    });
  }
}
