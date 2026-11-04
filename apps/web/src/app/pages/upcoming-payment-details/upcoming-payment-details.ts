import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../components/header/header';
import type { UpcomingPayment } from '../../models/payment.model';
import { UpcomingPaymentsService } from '../../services/upcoming-payments/upcoming-payments';

@Component({
  selector: 'app-upcoming-payment-details',
  imports: [DatePipe, Header],
  templateUrl: './upcoming-payment-details.html',
  styleUrl: './upcoming-payment-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpcomingPaymentDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly upcomingPaymentsService = inject(UpcomingPaymentsService);
  private readonly paymentId = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly isLoading = this.upcomingPaymentsService.isLoading;
  protected readonly payment = computed<UpcomingPayment | undefined>(() =>
    this.upcomingPaymentsService.payments().find((payment) => payment.id === this.paymentId)
  );

  constructor() {
    if (!this.upcomingPaymentsService.hasLoaded() && !this.upcomingPaymentsService.isLoading()) {
      this.upcomingPaymentsService.loadPayments();
    }
  }

  protected formatAmountValue(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  protected getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      KZT: '₸',
      NZD: 'NZ$',
      USD: '$',
    };

    return symbols[currency] ?? currency;
  }

  protected formatDate(value?: string | Date): string {
    if (!value) {
      return 'Не указано';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Не указано';
    }

    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  protected getFrequencyLabel(frequency?: string): string {
    const labels: Record<string, string> = {
      WEEKLY: 'Еженедельно',
      MONTHLY: 'Ежемесячно',
    };

    return frequency ? labels[frequency] ?? frequency : 'Не указано';
  }

  protected archivePayment(payment: UpcomingPayment): void {
    if (payment.isActive === false || this.isLoading()) {
      return;
    }

    this.upcomingPaymentsService.archivePayment(payment.id, () => {
      void this.router.navigate(['/home']);
    });
  }
}
