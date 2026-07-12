import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { BaseHttp } from '../services/base-http/base-http';
import type { Account, CreateAccountDto } from '../models/account.model';
import { NotificationsService } from '../services/notifications/notifications';

interface AccountsState {
  readonly accounts: ReadonlyArray<Account>;
  readonly isLoading: boolean;
}

const initialState: AccountsState = {
  accounts: [],
  isLoading: false,
};

const API_URL = '/api/accounts' as const;

function normalizeAccount(account: Account): Account {
  return {
    ...account,
    name: account.name?.trim() || account.cardName?.trim() || 'Account',
    balance: Number(account.balance),
  };
}

export const AccountsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ accounts }) => ({
    accountsCount: computed(() => accounts().length),
    hasAccounts: computed(() => accounts().length > 0),
    totalBalance: computed(() => accounts().reduce((sum, account) => sum + Number(account.balance), 0)),
  })),
  withMethods((store) => {
    const http = inject(BaseHttp);
    const notifications = inject(NotificationsService);

    return {
      loadAccounts: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() =>
            http.get<Account[]>(API_URL).pipe(
              tap((accounts) =>
                patchState(store, {
                  accounts: accounts.map(normalizeAccount),
                  isLoading: false,
                })
              ),
              catchError(() => {
                patchState(store, {
                  isLoading: false,
                });
                return of([]);
              })
            )
          )
        )
      ),

      createAccount: rxMethod<CreateAccountDto>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((dto) =>
            http.post<Account>(API_URL, dto).pipe(
              tap((newAccount) => {
                patchState(store, {
                  accounts: [...store.accounts(), normalizeAccount(newAccount)],
                  isLoading: false,
                });
                notifications.success();
              }),
              catchError(() => {
                patchState(store, {
                  isLoading: false,
                });
                return of(null);
              })
            )
          )
        )
      ),

      deleteAccount: rxMethod<number>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap((id) =>
            http.delete<void>(`${API_URL}/${id}`).pipe(
              tap(() => {
                patchState(store, {
                  accounts: store.accounts().filter((account) => account.id !== id),
                  isLoading: false,
                });
                notifications.success();
              }),
              catchError(() => {
                patchState(store, {
                  isLoading: false,
                });
                return of(null);
              })
            )
          )
        )
      ),
    };
  })
);
