import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';
import { AccountsSection } from '../../components/cards-section/cards-section';
import { FinancialOverview } from '../../components/financial-overview/financial-overview';
import type { MoneyCard } from '../../components/money-card/money-card';
import { UpcomingPaymentsSection } from '../../components/upcoming-payments-section/upcoming-payments-section';
import { SpendingAnalysis } from '../../components/spending-analysis/spending-analysis';
import type { UpcomingPayment } from '../../models/payment.model';
import { AccountsService } from '../../services/accounts/accounts';
import { NetworkStatusService } from '../../services/network-status/network-status';
import { UpcomingPaymentsService } from '../../services/upcoming-payments/upcoming-payments';

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
  private readonly upcomingPaymentsService = inject(UpcomingPaymentsService);
  private readonly networkStatusService = inject(NetworkStatusService);

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

  protected readonly upcomingPayments = this.upcomingPaymentsService.payments;

  constructor() {
    effect(() => {
      if (!this.networkStatusService.isOnline()) {
        return;
      }

      if (!this.accountsService.hasAccounts() && !this.accountsService.isLoading()) {
        void this.accountsService.loadAccounts();
      }

      if (!this.upcomingPaymentsService.hasLoaded() && !this.upcomingPaymentsService.isLoading()) {
        this.upcomingPaymentsService.loadPayments();
      }
    });
  }

  protected onPaymentClick(payment: UpcomingPayment): void {
    void this.router.navigate(['/upcoming-payments', payment.id]);
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
