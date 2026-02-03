import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { BaseHttp } from '../services/base-http/base-http';

export type OperationType = 'income' | 'expense';

export interface Operation {
  readonly id: string;
  readonly amount: number;
  readonly category: string;
  readonly description: string;
  readonly date: string;
  readonly type: OperationType;
}

export interface CreateOperationDto {
  readonly amount: number;
  readonly category: string;
  readonly description: string;
  readonly date: string;
  readonly type: OperationType;
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
    incomeOperations: computed(() => operations().filter(op => op.type === 'income')),
    expenseOperations: computed(() => operations().filter(op => op.type === 'expense')),
    totalIncome: computed(() =>
      operations()
        .filter(op => op.type === 'income')
        .reduce((sum, op) => sum + op.amount, 0)
    ),
    totalExpense: computed(() =>
      operations()
        .filter(op => op.type === 'expense')
        .reduce((sum, op) => sum + op.amount, 0)
    ),
    balance: computed(() => {
      const income = operations().filter(op => op.type === 'income').reduce((sum, op) => sum + op.amount, 0);
      const expense = operations().filter(op => op.type === 'expense').reduce((sum, op) => sum + op.amount, 0);
      return income - expense;
    }),
    hasOperations: computed(() => operations().length > 0),
  })),
  withMethods((store) => {
    const http = inject(BaseHttp);

    return {
      loadOperations: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() =>
            http.get<Operation[]>(API_URL).pipe(
              tap(operations => patchState(store, { operations, isLoading: false })),
              catchError(error => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to load operations'
                });
                return of([]);
              })
            )
          )
        )
      ),

      loadOperation: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(id =>
            http.get<Operation>(`${API_URL}/${id}`).pipe(
              tap(operation => patchState(store, { selectedOperation: operation, isLoading: false })),
              catchError(error => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to load operation'
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
          switchMap(dto =>
            http.post<Operation>(API_URL, dto).pipe(
              tap(newOperation =>
                patchState(store, {
                  operations: [...store.operations(), newOperation],
                  isLoading: false,
                })
              ),
              catchError(error => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to create operation'
                });
                return of(null);
              })
            )
          )
        )
      ),

      deleteOperation: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(id =>
            http.delete<void>(`${API_URL}/${id}`).pipe(
              tap(() =>
                patchState(store, {
                  operations: store.operations().filter(op => op.id !== id),
                  isLoading: false,
                })
              ),
              catchError(error => {
                patchState(store, {
                  isLoading: false,
                  error: error.message || 'Failed to delete operation'
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
