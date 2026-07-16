import { inject, Injectable } from '@angular/core';
import { UpcomingPaymentsStore, type CreateUpcomingPaymentDto } from '../../store/upcoming-payments.store';

@Injectable({
  providedIn: 'root',
})
export class UpcomingPaymentsService {
  private readonly store = inject(UpcomingPaymentsStore);

  readonly payments = this.store.payments;
  readonly isLoading = this.store.isLoading;
  readonly hasLoaded = this.store.hasLoaded;
  readonly error = this.store.error;
  readonly paymentsCount = this.store.paymentsCount;
  readonly hasPayments = this.store.hasPayments;

  loadPayments(): void {
    this.store.loadPayments();
  }

  createPayment(dto: CreateUpcomingPaymentDto): void {
    this.store.createPayment(dto);
  }

  archivePayment(id: string, onSuccess?: () => void): void {
    this.store.archivePayment({ id, onSuccess });
  }

  clearError(): void {
    this.store.clearError();
  }
}
