import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { BaseHttp } from '../services/base-http/base-http';
import { NotificationsService } from '../services/notifications/notifications';

export interface Transfer {
  readonly id: string | number;
  readonly fromAccountId: number;
  readonly toAccountId: number;
  readonly debitAmount: number;
  readonly creditAmount: number;
  readonly comment?: string;
}

export interface CreateTransferDto {
  readonly fromAccountId: number;
  readonly toAccountId: number;
  readonly debitAmount: number;
  readonly creditAmount: number;
  readonly comment?: string;
}

interface TransfersState {
  readonly transfers: ReadonlyArray<Transfer>;
  readonly selectedTransfer: Transfer | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

const initialState: TransfersState = {
  transfers: [],
  selectedTransfer: null,
  isLoading: false,
  error: null,
};

const API_URL = '/api/transfers' as const;

export const TransfersStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ transfers }) => ({
    transfersCount: computed(() => transfers().length),
    hasTransfers: computed(() => transfers().length > 0),
  })),
  withMethods((store) => {
    const http = inject(BaseHttp);
    const notifications = inject(NotificationsService);

    return {
      loadTransfers: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() =>
            http.get<Transfer[]>(API_URL).pipe(
              tap((transfers) => patchState(store, { transfers, isLoading: false })),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to load transfers',
                });
                return of([]);
              })
            )
          )
        )
      ),

      createTransfer: rxMethod<CreateTransferDto>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((dto) =>
            http.post<Transfer>(API_URL, dto).pipe(
              tap((newTransfer) => {
                patchState(store, {
                  transfers: [...store.transfers(), newTransfer],
                  isLoading: false,
                });
                notifications.success();
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to create transfer',
                });
                return of(null);
              })
            )
          )
        )
      ),

      clearSelectedTransfer(): void {
        patchState(store, { selectedTransfer: null });
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  })
);
