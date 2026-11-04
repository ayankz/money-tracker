import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-upcoming-payment-card',
  imports: [DatePipe],
  templateUrl: './upcoming-payment-card.html',
  styleUrl: './upcoming-payment-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-paid]': 'isPaid()',
    '(click)': 'handleClick()',
    'role': 'button',
    'tabindex': '0',
    '(keydown.enter)': 'handleClick()',
    '(keydown.space)': 'handleClick()',
  },
})
export class UpcomingPaymentCard {
  readonly title = input.required<string>();
  readonly amount = input.required<number>();
  readonly currency = input<string>('KZT');
  readonly dueDate = input.required<string | Date>();
  readonly frequency = input<string>('');
  readonly isPaid = input<boolean>(false);

  readonly clicked = output<void>();

  protected handleClick(): void {
    this.clicked.emit();
  }

  protected formatAmount(): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: this.currency() || 'KZT',
      maximumFractionDigits: 2,
    }).format(this.amount());
  }

  protected getFrequencyLabel(): string {
    return {
      WEEKLY: 'Еженедельно',
      MONTHLY: 'Ежемесячно',
      DAILY: 'Ежедневно',
      YEARLY: 'Ежегодно',
    }[this.frequency()] ?? this.frequency();
  }
}
