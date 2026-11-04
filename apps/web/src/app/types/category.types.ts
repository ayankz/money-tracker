export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly type: CategoryType;
}

export type ApiCategoryBase = Omit<Category, 'id'> & {
  readonly id: string | number;
};

export interface CreateCategoryDto {
  readonly name: string;
  readonly type: CategoryType;
}
