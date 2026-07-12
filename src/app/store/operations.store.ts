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
}

export interface CreateOperationDto {
  readonly type: OperationType;
  readonly amount: number;
  readonly categoryId?: number;
  readonly comment?: string;
  readonly accountId?: number;
}

interface OperationsState {
  readonly operations: ReadonlyArray<Operation>;
  readonly selectedOperation: Operation | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

const initialState: OperationsState = {
  operations: [],
  selectedOperation: null,
  isLoading: false,
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
              tap((operations) => patchState(store, { operations, isLoading: false })),
              catchError((error) => {
                patchState(store, {
                  isLoading: false,
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

      createOperation: rxMethod<CreateOperationDto>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((dto) =>
            http.post<Operation>(API_URL, dto).pipe(
              tap((newOperation) => {
                patchState(store, {
                  operations: [...store.operations(), newOperation],
                  isLoading: false,
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
