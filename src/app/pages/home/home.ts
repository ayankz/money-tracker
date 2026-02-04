import { ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {Header} from '../../components/header/header';
import {BalanceCard} from '../../components/balance-card/balance-card';
import {UpcomingPaymentCard} from '../../components/upcoming-payment-card/upcoming-payment-card';
import {SpendingAnalysis} from '../../components/spending-analysis/spending-analysis';
import type {UpcomingPayment} from '../../models/payment.model';

@Component({
    selector: 'app-home',
    imports: [Header, BalanceCard, UpcomingPaymentCard, SpendingAnalysis],
    templateUrl: './home.html',
    styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly balance = signal<number>(12500);
  protected readonly monthDifference = signal<number>(850.50);
  protected readonly monthlyBudget = signal<number>(3000);
  protected readonly spent = signal<number>(2250);

  protected readonly upcomingPayments = signal<ReadonlyArray<UpcomingPayment>>([
    {
      id: '1',
      title: 'Rent',
      amount: 1200,
      dueDate: '2026-01-12',
      icon: 'home',
    },
    {
      id: '2',
      title: 'Internet',
      amount: 80,
      dueDate: '2026-01-15',
      icon: 'wifi',
    },
    {
      id: '3',
      title: 'Electricity',
      amount: 150,
      dueDate: '2026-01-18',
      icon: 'electric',
    },
  ]);

  protected onPaymentClick(payment: UpcomingPayment): void {
    console.log('Payment clicked:', payment);
    // TODO: Navigate to payment details or open payment modal
  }
}
