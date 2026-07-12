import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe, NgStyle } from '@angular/common';

export interface MoneyCard {
  id: number;
  name: string;
  digits: string;
  showDigits?: boolean;
  typeLabel?: string;
  color: string;
  balance: number;
}

@Component({
  selector: 'app-money-card',
  imports: [NgStyle, DecimalPipe],
  templateUrl: './money-card.html',
  styleUrl: './money-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoneyCardComponent {
  readonly card = input.required<MoneyCard>();
  readonly clickable = input<boolean>(false);
  readonly showDelete = input<boolean>(false);
  readonly open = output<void>();
  readonly remove = output<number>();

  protected onOpen(): void {
    this.open.emit();
  }

  protected onRemove(): void {
    this.remove.emit(this.card().id);
  }
}
