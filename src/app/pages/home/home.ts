import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';
import { CashWallet } from '../../components/cash-wallet/cash-wallet';
import { CardsSection } from '../../components/cards-section/cards-section';
import { FinancialOverview } from '../../components/financial-overview/financial-overview';
import type { MoneyCard } from '../../components/money-card/money-card';
import { UpcomingPaymentsSection } from '../../components/upcoming-payments-section/upcoming-payments-section';
import { SpendingAnalysis } from '../../components/spending-analysis/spending-analysis';
import type { UpcomingPayment } from '../../models/payment.model';
import { CardsService } from '../../services/cards/cards';

@Component({
  selector: 'app-home',
  imports: [Header, FinancialOverview, CardsSection, CashWallet, UpcomingPaymentsSection, SpendingAnalysis],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly router = inject(Router);
  private readonly cardsService = inject(CardsService);

  protected readonly weeklyEarnings = signal<number>(0);
  protected readonly monthlyEarnings = signal<number>(9800);
  protected readonly weeklySpending = signal<number>(1120.5);
  protected readonly monthlySpending = signal<number>(4250);
  protected readonly cashWalletBalance = signal<number>(500);
  protected readonly monthlyBudget = signal<number>(3000);
  protected readonly spent = signal<number>(2250);
  protected readonly cards = computed<ReadonlyArray<MoneyCard>>(() =>
    this.cardsService.cards().map((card) => ({
      id: card.id,
      name: card.name ?? 'Card',
      digits: card.digits,
      balance: Number(card.balance),
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
    if (!this.cardsService.hasCards() && !this.cardsService.isLoading()) {
      void this.cardsService.loadCards();
    }
  }

  protected onPaymentClick(payment: UpcomingPayment): void {
    console.log('Payment clicked:', payment);
    // TODO: Navigate to payment details or open payment modal
  }

  protected openMyMoney(): void {
    void this.router.navigate(['/my-money']);
  }

  protected openAddCard(): void {
    void this.router.navigate([{ outlets: { sheet: ['add-card'] } }]);
  }

  protected topUpCashWallet(): void {
    console.log('Top up cash wallet');
    // TODO: Implement cash wallet top up flow
  }

  protected removeCard(cardId: number): void {
    this.cardsService.deleteCard(cardId);
  }
}
