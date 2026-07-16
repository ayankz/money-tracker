import { inject, Injectable } from '@angular/core';
import { AccountsStore } from '../../store/accounts.store';
import type { CreateAccountDto } from '../../models/account.model';

/**
 * Facade service for accounts management.
 * Provides a simplified API over the AccountsStore.
 * For direct store access, inject AccountsStore instead.
 */
@Injectable({
  providedIn: 'root',
})
export class AccountsService {
  private readonly store = inject(AccountsStore);

  readonly accounts = this.store.accounts;
  readonly isLoading = this.store.isLoading;
  readonly hasLoaded = this.store.hasLoaded;
  readonly accountsCount = this.store.accountsCount;
  readonly hasAccounts = this.store.hasAccounts;
  readonly totalBalance = this.store.totalBalance;

  loadAccounts(): void {
    this.store.loadAccounts();
  }

  createAccount(dto: CreateAccountDto): void {
    this.store.createAccount(dto);
  }

  deleteAccount(id: number): void {
    this.store.deleteAccount(id);
  }
}
