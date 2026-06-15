import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';
import { CardsSection } from '../../components/cards-section/cards-section';
import type { MoneyCard } from '../../components/money-card/money-card';
import { CardsService } from '../../services/cards/cards';

@Component({
  selector: 'app-my-money',
  imports: [Header, CardsSection],
  templateUrl: './my-money.html',
  styleUrl: './my-money.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyMoney {
  private readonly router = inject(Router);
  private readonly cardsService = inject(CardsService);

  protected readonly cards = computed<ReadonlyArray<MoneyCard>>(() =>
    this.cardsService.cards().map((card) => ({
      id: card.id,
      name: card.name ?? 'Card',
      digits: card.digits,
      balance: Number(card.balance),
      color: 'var(--profile-card-gradient)',
    }))
  );

  constructor() {
    if (!this.cardsService.hasCards() && !this.cardsService.isLoading()) {
      void this.cardsService.loadCards();
    }
  }

  protected openAddCard(): void {
    void this.router.navigate([{ outlets: { sheet: ['add-card'] } }]);
  }

  protected removeCard(cardId: number): void {
    this.cardsService.deleteCard(cardId);
  }
}
