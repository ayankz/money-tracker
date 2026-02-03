import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PaymentIcon } from '../payment-icon/payment-icon';
import type { PaymentIcon as PaymentIconType } from '../../models/payment.model';

@Component({
  selector: 'app-upcoming-payment-card',
  imports: [DatePipe, DecimalPipe, PaymentIcon],
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
  readonly dueDate = input.required<string | Date>();
  readonly icon = input<PaymentIconType>('default');
  readonly isPaid = input<boolean>(false);

  readonly clicked = output<void>();

  protected handleClick(): void {
    this.clicked.emit();
  }
}
