export interface UpcomingPayment {
  readonly id: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly title: string;
  readonly amount: number;
  readonly currency: string;
  readonly dueDate: string | Date;
  readonly frequency?: string;
  readonly categoryId?: number;
  readonly categoryName?: string;
  readonly comment?: string;
  readonly isActive?: boolean;
  readonly isPaid?: boolean;
}
