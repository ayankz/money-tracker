import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-balance-card',
  imports: [DecimalPipe, NgClass],
  templateUrl: './balance-card.html',
  styleUrl: './balance-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceCard {
  readonly balance = input.required<number>();
  readonly monthDifference = input<number>(0);

  protected readonly isPositive = computed(() => this.monthDifference() > 0);
  protected readonly isNegative = computed(() => this.monthDifference() < 0);
  protected readonly differencePercent = computed(() => {
    if (this.balance() === 0) return 0;
    return Math.abs((this.monthDifference() / this.balance()) * 100);
  });
}
