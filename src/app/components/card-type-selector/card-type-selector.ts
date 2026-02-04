import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

export type CardType = 'credit' | 'debit' | 'cash';

export interface CardTypeOption {
  type: CardType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-card-type-selector',
  imports: [NgClass],
  templateUrl: './card-type-selector.html',
  styleUrl: './card-type-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTypeSelector {
  readonly selectedType = input<CardType>('credit');
  readonly typeSelected = output<CardType>();

  protected readonly types: CardTypeOption[] = [
    { type: 'credit', label: 'Кредитная', icon: '💳' },
    { type: 'debit', label: 'Дебетовая', icon: '💵' },
    { type: 'cash', label: 'Наличные', icon: '💰' },
  ];

  protected onTypeSelect(type: CardType): void {
    this.typeSelected.emit(type);
  }
}