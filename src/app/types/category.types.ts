export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  iconId: string;
  iconPath: string;
  iconColor: string;
  backgroundColor: string;
}

export interface CreateCategoryDto {
  readonly name: string;
  readonly type: CategoryType;
}
