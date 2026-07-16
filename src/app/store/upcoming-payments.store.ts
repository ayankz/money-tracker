import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import type { UpcomingPayment } from '../models/payment.model';
import { BaseHttp } from '../services/base-http/base-http';
import { NotificationsService } from '../services/notifications/notifications';
import type { ApiCategoryBase } from '../types/category.types';

interface ApiUpcomingPayment {
  readonly id: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly title: string;
  readonly amount: string | number;
  readonly currency: string;
  readonly frequency: string;
  readonly nextDueDate: string;
  readonly categoryId?: number;
  readonly comment?: string;
  readonly isActive: boolean;
  readonly userId: number;
  readonly category?: ApiCategoryBase;
}

export interface CreateUpcomingPaymentDto {
  readonly title: string;
  readonly amount: number;
  readonly currency: string;
  readonly frequency: string;
  readonly nextDueDate: string;
  readonly categoryId: number;
  readonly comment?: string;
  readonly isActive?: boolean;
}

interface UpcomingPaymentsState {
  readonly payments: ReadonlyArray<UpcomingPayment>;
  readonly isLoading: boolean;
  readonly hasLoaded: boolean;
  readonly error: string | null;
}

const initialState: UpcomingPaymentsState = {
  payments: [],
  isLoading: false,
  hasLoaded: false,
  error: null,
};

const API_URL = '/api/upcoming-payments' as const;

function normalizePayment(payment: ApiUpcomingPayment): UpcomingPayment {
  return {
    id: String(payment.id),
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    title: payment.title,
    amount: Number(payment.amount),
    currency: payment.currency || 'KZT',
    dueDate: payment.nextDueDate,
    frequency: payment.frequency,
    categoryId: payment.categoryId,
    categoryName: payment.category?.name,
    comment: payment.comment,
    isActive: payment.isActive,
    isPaid: !payment.isActive,
  };
}

interface ArchiveUpcomingPaymentRequest {
  readonly id: string;
  readonly onSuccess?: () => void;
}

export const UpcomingPaymentsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ payments }) => ({
    paymentsCount: computed(() => payments().length),
    hasPayments: computed(() => payments().length > 0),
  })),
  withMethods((store) => {
    const http = inject(BaseHttp);
    const notifications = inject(NotificationsService);

    return {
      loadPayments: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() =>
            http.get<ApiUpcomingPayment[]>(API_URL).pipe(
              tap((payments) =>
                patchState(store, {
                  payments: payments.filter((payment) => payment.isActive).map(normalizePayment),
                  isLoading: false,
                  hasLoaded: true,
                })
              ),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  hasLoaded: true,
                  error: error.message || 'Failed to load upcoming payments',
                });
                return of([]);
              })
            )
          )
        )
      ),

      createPayment: rxMethod<CreateUpcomingPaymentDto>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((dto) =>
            http.post<ApiUpcomingPayment>(API_URL, dto).pipe(
              tap((payment) => {
                patchState(store, {
                  payments: [...store.payments(), normalizePayment(payment)],
                  isLoading: false,
                  hasLoaded: true,
                });
                notifications.success();
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to create upcoming payment',
                });
                return of(null);
              })
            )
          )
        )
      ),

      archivePayment: rxMethod<ArchiveUpcomingPaymentRequest>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ id, onSuccess }) =>
            http.patch<ApiUpcomingPayment>(`${API_URL}/${id}/archive`, {}).pipe(
              tap(() => {
                patchState(store, {
                  payments: store.payments().filter((existingPayment) => existingPayment.id !== id),
                  isLoading: false,
                  hasLoaded: true,
                });
                notifications.success('Платеж архивирован');
                onSuccess?.();
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to archive upcoming payment',
                });
                notifications.error('Не удалось архивировать платеж');
                return of(null);
              })
            )
          )
        )
      ),

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  })
);
