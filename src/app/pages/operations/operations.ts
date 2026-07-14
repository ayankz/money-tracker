import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Header } from '../../components/header/header';
import {
  OperationsFilters,
  type OperationPeriodFilter,
  type OperationTypeFilter,
} from '../../components/operations-filters/operations-filters';
import { AccountsService } from '../../services/accounts/accounts';
import { CategoryService } from '../../services/category.service';
import { OperationsService } from '../../services/operations/operations';
import type { Account } from '../../models/account.model';
import type { Category } from '../../types/category.types';
import type { Operation, OperationType } from '../../store/operations.store';

interface OperationListItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly amountLabel: string;
  readonly amountClass: 'income' | 'expense';
  readonly groupLabel: string;
  readonly type: OperationType;
}

interface OperationGroup {
  readonly label: string;
  readonly items: ReadonlyArray<OperationListItem>;
}

@Component({
  selector: 'app-operations',
  imports: [FormsModule, Header, OperationsFilters],
  templateUrl: './operations.html',
  styleUrl: './operations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Operations {
  private readonly operationsService = inject(OperationsService);
  private readonly accountsService = inject(AccountsService);
  private readonly categoryService = inject(CategoryService);

  protected readonly searchQuery = signal('');
  protected readonly showFilters = signal(false);
  protected readonly selectedType = signal<OperationTypeFilter>('ALL');
  protected readonly selectedAccountId = signal<string>('ALL');
  protected readonly selectedPeriod = signal<OperationPeriodFilter>('ALL');

  protected readonly accounts = this.accountsService.accounts;
  protected readonly operations = this.operationsService.operations;
  protected readonly categories = this.categoryService.categories;
  protected readonly isLoading = this.operationsService.isLoading;

  protected readonly operationGroups = computed<ReadonlyArray<OperationGroup>>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const typeFilter = this.selectedType();
    const accountFilter = this.selectedAccountId();
    const periodFilter = this.selectedPeriod();

    const filtered = this.operations()
      .filter((operation) => typeFilter === 'ALL' || operation.type === typeFilter)
      .filter((operation) => accountFilter === 'ALL' || String(operation.accountId ?? '') === accountFilter)
      .filter((operation) => this.matchesPeriod(operation, periodFilter))
      .map((operation) => this.toListItem(operation))
      .filter((item) => {
        if (!query) {
          return true;
        }

        return `${item.title} ${item.subtitle} ${item.amountLabel}`.toLowerCase().includes(query);
      });

    return this.groupOperations(filtered);
  });

  protected readonly hasActiveFilters = computed(() =>
    this.searchQuery().trim().length > 0
    || this.selectedType() !== 'ALL'
    || this.selectedAccountId() !== 'ALL'
    || this.selectedPeriod() !== 'ALL'
  );

  constructor() {
    this.operationsService.loadOperations();

    if (!this.accountsService.hasAccounts() && !this.accountsService.isLoading()) {
      this.accountsService.loadAccounts();
    }

    if (!this.categoryService.hasCategories() && !this.categoryService.isLoading()) {
      this.categoryService.loadCategories();
    }
  }

  protected toggleFilters(): void {
    this.showFilters.update((value) => !value);
  }

  protected updateSearchQuery(value: string): void {
    this.searchQuery.set(value);
  }

  protected updateTypeFilter(type: OperationTypeFilter): void {
    this.selectedType.set(type);
  }

  protected updateAccountFilter(accountId: string): void {
    this.selectedAccountId.set(accountId);
  }

  protected updatePeriodFilter(period: OperationPeriodFilter): void {
    this.selectedPeriod.set(period);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedType.set('ALL');
    this.selectedAccountId.set('ALL');
    this.selectedPeriod.set('ALL');
  }

  private toListItem(operation: Operation): OperationListItem {
    const category = this.getCategory(operation.categoryId);
    const account = this.getAccount(operation.accountId);
    const timestamp = this.getOperationTimestamp(operation);
    const subtitleParts = [
      category?.name,
      account ? this.getAccountLabel(account) : 'Без аккаунта',
      this.formatTime(timestamp),
    ].filter(Boolean);

    return {
      id: String(operation.id),
      title: operation.comment?.trim() || category?.name || (operation.type === 'INCOME' ? 'Доход' : 'Расход'),
      subtitle: subtitleParts.join(' • '),
      amountLabel: this.formatAmount(operation.amount, operation.type, account),
      amountClass: operation.type === 'INCOME' ? 'income' : 'expense',
      groupLabel: this.getGroupLabel(timestamp),
      type: operation.type,
    };
  }

  private groupOperations(items: ReadonlyArray<OperationListItem>): ReadonlyArray<OperationGroup> {
    const groups = new Map<string, OperationListItem[]>();

    for (const item of items) {
      const groupItems = groups.get(item.groupLabel) ?? [];
      groupItems.push(item);
      groups.set(item.groupLabel, groupItems);
    }

    return Array.from(groups.entries()).map(([label, groupItems]) => ({
      label,
      items: groupItems,
    }));
  }

  private getCategory(categoryId?: number): Category | undefined {
    if (categoryId === undefined || categoryId === null) {
      return undefined;
    }

    return this.categories().find((category) => category.id === String(categoryId));
  }

  private getAccount(accountId?: number): Account | undefined {
    if (accountId === undefined || accountId === null) {
      return undefined;
    }

    return this.accounts().find((account) => account.id === accountId);
  }

  private getAccountLabel(account: Account): string {
    if (account.type === 'CARD' && account.cardName) {
      return account.digits ? `${account.cardName} •• ${account.digits}` : account.cardName;
    }

    return account.name || 'Account';
  }

  private formatAmount(amount: number, type: OperationType, account?: Account): string {
    const sign = type === 'INCOME' ? '+' : '-';
    const currency = account?.currency || 'KZT';
    const formatted = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));

    return `${sign}${formatted}`;
  }

  private getOperationTimestamp(operation: Operation): Date {
    return new Date(operation.createdAt ?? operation.updatedAt ?? Date.now());
  }

  private getGroupLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);

    if (diffDays === 0) {
      return 'Сегодня';
    }

    if (diffDays === 1) {
      return 'Вчера';
    }

    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private matchesPeriod(operation: Operation, period: OperationPeriodFilter): boolean {
    if (period === 'ALL') {
      return true;
    }

    const timestamp = this.getOperationTimestamp(operation);
    const now = new Date();

    if (period === 'LAST_7_DAYS') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return timestamp >= sevenDaysAgo;
    }

    return timestamp.getFullYear() === now.getFullYear() && timestamp.getMonth() === now.getMonth();
  }

}
