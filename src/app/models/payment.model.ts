export type PaymentIcon = 'home' | 'wifi' | 'electric' | 'water' | 'phone' | 'gas' | 'default';

export interface UpcomingPayment {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly dueDate: string | Date;
  readonly icon: PaymentIcon;
  readonly isPaid?: boolean;
}
