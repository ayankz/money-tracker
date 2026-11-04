import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UpcomingPaymentCard } from '../upcoming-payment-card/upcoming-payment-card';
import type { UpcomingPayment } from '../../models/payment.model';

@Component({
  selector: 'app-upcoming-payments-section',
  imports: [UpcomingPaymentCard],
  templateUrl: './upcoming-payments-section.html',
  styleUrl: './upcoming-payments-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpcomingPaymentsSection {
  readonly payments = input.required<ReadonlyArray<UpcomingPayment>>();
  readonly paymentClick = output<UpcomingPayment>();

  protected onPaymentClick(payment: UpcomingPayment): void {
    this.paymentClick.emit(payment);
  }
}
