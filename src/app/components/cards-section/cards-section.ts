import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MoneyCardComponent, type MoneyCard } from '../money-card/money-card';

@Component({
  selector: 'app-cards-section',
  imports: [MoneyCardComponent],
  templateUrl: './cards-section.html',
  styleUrl: './cards-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsSection {
  readonly cards = input.required<ReadonlyArray<MoneyCard>>();
  readonly title = input<string>('Your Money');
  readonly actionLabel = input<string>('Manage');
  readonly layout = input<'row' | 'stack'>('row');
  readonly showAddCardTile = input<boolean>(true);
  readonly cardsClickable = input<boolean>(false);
  readonly showDelete = input<boolean>(false);

  readonly action = output<void>();
  readonly addCard = output<void>();
  readonly removeCard = output<number>();
  readonly cardClick = output<number>();

  protected onAction(): void {
    this.action.emit();
  }

  protected onAddCard(): void {
    this.addCard.emit();
  }

  protected onRemoveCard(cardId: number): void {
    this.removeCard.emit(cardId);
  }

  protected onCardClick(cardId: number): void {
    this.cardClick.emit(cardId);
  }
}
