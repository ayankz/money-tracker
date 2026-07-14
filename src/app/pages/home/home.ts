import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';
import { AccountsSection } from '../../components/cards-section/cards-section';
import { FinancialOverview } from '../../components/financial-overview/financial-overview';
import type { MoneyCard } from '../../components/money-card/money-card';
import { UpcomingPaymentsSection } from '../../components/upcoming-payments-section/upcoming-payments-section';
import { SpendingAnalysis } from '../../components/spending-analysis/spending-analysis';
import type { UpcomingPayment } from '../../models/payment.model';
import { AccountsService } from '../../services/accounts/accounts';

@Component({
  selector: 'app-home',
  imports: [Header, FinancialOverview, AccountsSection, UpcomingPaymentsSection, SpendingAnalysis],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly router = inject(Router);
  private readonly accountsService = inject(AccountsService);

  protected readonly weeklyEarnings = signal<number>(0);
  protected readonly monthlyEarnings = signal<number>(9800);
  protected readonly weeklySpending = signal<number>(1120.5);
  protected readonly monthlySpending = signal<number>(4250);
  protected readonly monthlyBudget = signal<number>(3000);
  protected readonly spent = signal<number>(2250);
  protected readonly accounts = computed<ReadonlyArray<MoneyCard>>(() =>
    this.accountsService.accounts().map((account) => ({
      id: account.id,
      name: account.cardName ?? account.name ?? 'Account',
      digits: account.digits,
      showDigits: account.type === 'CARD',
      typeLabel: account.type === 'CARD' ? 'Карта' : 'Наличка',
      currency: account.currency,
      balance: Number(account.balance),
      color: 'var(--profile-card-gradient)',
    }))
  );

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

  constructor() {
    if (!this.accountsService.hasAccounts() && !this.accountsService.isLoading()) {
      void this.accountsService.loadAccounts();
    }
  }

  protected onPaymentClick(payment: UpcomingPayment): void {
    console.log('Payment clicked:', payment);
    // TODO: Navigate to payment details or open payment modal
  }

  protected openMyMoney(): void {
    void this.router.navigate(['/my-money']);
  }

  protected openAddAccount(): void {
    void this.router.navigate([{ outlets: { sheet: ['add-account'] } }], { replaceUrl: true });
  }

  protected openTransfer(): void {
    void this.router.navigate([{ outlets: { sheet: ['create-transfer'] } }], { replaceUrl: true });
  }

  protected removeAccount(accountId: number): void {
    this.accountsService.deleteAccount(accountId);
  }
}
