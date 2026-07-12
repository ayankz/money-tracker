import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../components/header/header';
import { AccountsSection } from '../../components/cards-section/cards-section';
import type { MoneyCard } from '../../components/money-card/money-card';
import { AccountsService } from '../../services/accounts/accounts';

@Component({
  selector: 'app-my-money',
  imports: [Header, AccountsSection],
  templateUrl: './my-money.html',
  styleUrl: './my-money.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyMoney {
  private readonly router = inject(Router);
  private readonly accountsService = inject(AccountsService);

  protected readonly accounts = computed<ReadonlyArray<MoneyCard>>(() =>
    this.accountsService.accounts().map((account) => ({
      id: account.id,
      name: account.cardName ?? account.name ?? 'Account',
      digits: account.digits,
      showDigits: account.type === 'CARD',
      typeLabel: account.type === 'CARD' ? 'Карта' : 'Наличка',
      balance: Number(account.balance),
      color: 'var(--profile-card-gradient)',
    }))
  );

  constructor() {
    if (!this.accountsService.hasAccounts() && !this.accountsService.isLoading()) {
      void this.accountsService.loadAccounts();
    }
  }

  protected openAddAccount(): void {
    void this.router.navigate([{ outlets: { sheet: ['add-account'] } }], { replaceUrl: true });
  }

  protected removeAccount(accountId: number): void {
    this.accountsService.deleteAccount(accountId);
  }
}
