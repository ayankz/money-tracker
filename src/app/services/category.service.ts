import { inject, Injectable } from '@angular/core';
import { CategoriesStore } from '../store/categories.store';
import type { CreateCategoryDto } from '../types/category.types';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly store = inject(CategoriesStore);

  readonly categories = this.store.categories;
  readonly isLoading = this.store.isLoading;
  readonly categoriesCount = this.store.categoriesCount;
  readonly hasCategories = this.store.hasCategories;
  readonly selectedType = this.store.selectedType;

  loadCategories(): void {
    this.store.loadCategories();
  }

  createCategory(dto: CreateCategoryDto): void {
    this.store.createCategory(dto);
  }
}
