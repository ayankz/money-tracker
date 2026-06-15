import { inject, Injectable } from '@angular/core';
import { CardsStore } from '../../store/cards.store';
import type { CreateCardDto } from '../../models/card.model';

/**
 * Facade service for cards management.
 * Provides a simplified API over the CardsStore.
 * For direct store access, inject CardsStore instead.
 */
@Injectable({
  providedIn: 'root',
})
export class CardsService {
  private readonly store = inject(CardsStore);

  readonly cards = this.store.cards;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly cardsCount = this.store.cardsCount;
  readonly hasCards = this.store.hasCards;
  readonly totalBalance = this.store.totalBalance;

  loadCards(): void {
    this.store.loadCards();
  }

  createCard(dto: CreateCardDto): void {
    this.store.createCard(dto);
  }

  deleteCard(id: number): void {
    this.store.deleteCard(id);
  }

  clearError(): void {
    this.store.clearError();
  }
}
