import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { BaseHttp } from '../services/base-http/base-http';
import { NotificationsService } from '../services/notifications/notifications';

export type OperationType = 'INCOME' | 'EXPENSE';

export interface Operation {
  readonly id: string | number;
  readonly type: OperationType;
  readonly amount: number;
  readonly categoryId?: number;
  readonly comment?: string;
  readonly accountId?: number;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface CreateOperationDto {
  readonly type: OperationType;
  readonly amount: number;
  readonly categoryId?: number;
  readonly comment?: string;
  readonly accountId?: number;
}

export interface OperationOverviewTotal {
  readonly currency: string;
  readonly income: number;
  readonly expense: number;
}

export interface OperationOverviewPeriod {
  readonly from: string;
  readonly to: string;
  readonly totals: ReadonlyArray<OperationOverviewTotal>;
}

export interface OperationOverview {
  readonly week: OperationOverviewPeriod;
  readonly month: OperationOverviewPeriod;
}

export type OperationOverviewRange = OperationOverviewPeriod;

export interface OperationOverviewRangeParams {
  readonly dateFrom: string;
  readonly dateTo: string;
}

interface OperationsState {
  readonly operations: ReadonlyArray<Operation>;
  readonly overview: OperationOverview | null;
  readonly overviewRange: OperationOverviewRange | null;
  readonly selectedOperation: Operation | null;
  readonly isLoading: boolean;
  readonly isOverviewLoading: boolean;
  readonly isOverviewRangeLoading: boolean;
  readonly hasLoaded: boolean;
  readonly hasOverviewLoaded: boolean;
  readonly hasOverviewRangeLoaded: boolean;
  readonly error: string | null;
}

const initialState: OperationsState = {
  operations: [],
  overview: null,
  overviewRange: null,
  selectedOperation: null,
  isLoading: false,
  isOverviewLoading: false,
  isOverviewRangeLoading: false,
  hasLoaded: false,
  hasOverviewLoaded: false,
  hasOverviewRangeLoaded: false,
  error: null,
};

const API_URL = '/api/operations' as const;

export const OperationsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ operations }) => ({
    operationsCount: computed(() => operations().length),
    incomeOperations: computed(() => operations().filter((operation) => operation.type === 'INCOME')),
    expenseOperations: computed(() => operations().filter((operation) => operation.type === 'EXPENSE')),
    totalIncome: computed(() =>
      operations()
        .filter((operation) => operation.type === 'INCOME')
        .reduce((sum, operation) => sum + operation.amount, 0)
    ),
    totalExpense: computed(() =>
      operations()
        .filter((operation) => operation.type === 'EXPENSE')
        .reduce((sum, operation) => sum + operation.amount, 0)
    ),
    balance: computed(() => {
      const income = operations()
        .filter((operation) => operation.type === 'INCOME')
        .reduce((sum, operation) => sum + operation.amount, 0);
      const expense = operations()
        .filter((operation) => operation.type === 'EXPENSE')
        .reduce((sum, operation) => sum + operation.amount, 0);

      return income - expense;
    }),
    hasOperations: computed(() => operations().length > 0),
  })),
  withMethods((store) => {
    const http = inject(BaseHttp);
    const notifications = inject(NotificationsService);

    return {
      loadOperations: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() =>
            http.get<Operation[]>(API_URL).pipe(
              tap((operations) => patchState(store, { operations, isLoading: false, hasLoaded: true })),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  hasLoaded: true,
                  error: error.message || 'Failed to load operations',
                });
                return of([]);
              })
            )
          )
        )
      ),

      loadOperation: rxMethod<string | number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((id) =>
            http.get<Operation>(`${API_URL}/${id}`).pipe(
              tap((operation) => patchState(store, { selectedOperation: operation, isLoading: false })),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to load operation',
                });
                return of(null);
              })
            )
          )
        )
      ),

      loadOverview: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isOverviewLoading: true, error: null })),
          switchMap(() =>
            http.get<OperationOverview>(`${API_URL}/overview`).pipe(
              tap((overview) =>
                patchState(store, {
                  overview,
                  isOverviewLoading: false,
                  hasOverviewLoaded: true,
                })
              ),
              catchError((error) => {
                patchState(store, {
                  isOverviewLoading: false,
                  hasOverviewLoaded: true,
                  error: error.message || 'Failed to load operations overview',
                });
                return of(null);
              })
            )
          )
        )
      ),

      loadOverviewRange: rxMethod<OperationOverviewRangeParams>(
        pipe(
          tap(() => patchState(store, { isOverviewRangeLoading: true, error: null })),
          switchMap(({ dateFrom, dateTo }) =>
            http.get<OperationOverviewRange>(`${API_URL}/overview/range`, {
              params: { dateFrom, dateTo },
            }).pipe(
              tap((overviewRange) =>
                patchState(store, {
                  overviewRange,
                  isOverviewRangeLoading: false,
                  hasOverviewRangeLoaded: true,
                })
              ),
              catchError((error) => {
                patchState(store, {
                  isOverviewRangeLoading: false,
                  hasOverviewRangeLoaded: true,
                  error: error.message || 'Failed to load operations overview range',
                });
                return of(null);
              })
            )
          )
        )
      ),

      createOperation: rxMethod<CreateOperationDto>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((dto) =>
            http.post<Operation>(API_URL, dto).pipe(
              tap((newOperation) => {
                patchState(store, {
                  operations: [...store.operations(), newOperation],
                  isLoading: false,
                  hasLoaded: true,
                });
                notifications.success();
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to create operation',
                });
                return of(null);
              })
            )
          )
        )
      ),

      deleteOperation: rxMethod<string | number>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((id) =>
            http.delete<void>(`${API_URL}/${id}`).pipe(
              tap(() => {
                patchState(store, {
                  operations: store.operations().filter((operation) => operation.id !== id),
                  isLoading: false,
                });
                notifications.success();
              }),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to delete operation',
                });
                return of(null);
              })
            )
          )
        )
      ),

      clearSelectedOperation(): void {
        patchState(store, { selectedOperation: null });
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  })
);
