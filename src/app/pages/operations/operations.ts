import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Header } from '../../components/header/header';
import {
  ActivityPeriodFilter,
  ActivityTypeFilter,
  OperationsFilters,
} from '../../components/operations-filters/operations-filters';
import { AccountsService } from '../../services/accounts/accounts';
import { CategoryService } from '../../services/category.service';
import { OperationsService } from '../../services/operations/operations';
import type { Account } from '../../models/account.model';
import type { Category } from '../../types/category.types';
import type { Operation, OperationType } from '../../store/operations.store';

interface OperationViewModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly amountLabel: string;
  readonly amountClass: 'income' | 'expense';
  readonly iconPath: string;
  readonly iconColor: string;
  readonly backgroundColor: string;
  readonly groupLabel: string;
  readonly type: OperationType;
  readonly accountId: string;
  readonly createdAt: Date | null;
}

const MONEY_ICON_PATH =
  'M12 3C7.03 3 3 5.24 3 8v8c0 2.76 4.03 5 9 5s9-2.24 9-5V8c0-2.76-4.03-5-9-5zm1 14.93V19h-2v-1.1c-1.72-.3-3-1.4-3-2.9h2c0 .55.45 1 1 1h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-1.66 0-3-1.34-3-3 0-1.5 1.28-2.6 3-2.9V7h2v1.07c1.72.3 3 1.4 3 2.93h-2c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1h2c1.66 0 3 1.34 3 3 0 1.5-1.28 2.6-3 2.93z';
const MONEY_ICON_COLOR = '#d98e73';
const MONEY_ICON_BACKGROUND = 'rgba(217, 142, 115, 0.16)';

@Component({
  selector: 'app-operations',
  imports: [Header, OperationsFilters],
  templateUrl: './operations.html',
  styleUrl: './operations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Operations {
  private readonly operationsService = inject(OperationsService);
  private readonly accountsService = inject(AccountsService);
  private readonly categoryService = inject(CategoryService);
  protected readonly selectedTypeFilter = signal<ActivityTypeFilter>('ALL');
  protected readonly selectedAccountFilter = signal<string>('ALL');
  protected readonly selectedPeriodFilter = signal<ActivityPeriodFilter>('ALL_TIME');
  protected readonly searchQuery = signal('');
  protected readonly typeFilters = [
    { value: 'ALL', label: 'All' },
    { value: 'INCOME', label: 'Income' },
    { value: 'EXPENSE', label: 'Expenses' },
  ] as const;
  protected readonly periodFilters = [
    { value: 'ALL_TIME', label: 'All time' },
    { value: 'THIS_MONTH', label: 'This Month' },
    { value: 'LAST_7_DAYS', label: 'Last 7 days' },
  ] as const;
  protected readonly accountFilters = computed<ReadonlyArray<{ value: string; label: string }>>(() => [
    { value: 'ALL', label: 'All Accounts' },
    ...this.accountsService.accounts().map((account) => ({
      value: String(account.id),
      label: this.getAccountLabel(account),
    })),
  ]);
  protected readonly filteredOperations = computed(() =>
    this.operationsService.operations()
      .filter((operation) => this.matchesTypeFilter(operation))
      .filter((operation) => this.matchesAccountFilter(operation))
      .filter((operation) => this.matchesPeriodFilter(operation))
      .map((operation) => this.toViewModel(operation))
      .filter((operation) => this.matchesSearchQuery(operation))
  );

  protected readonly groupedOperations = computed(() => {
    const groups = new Map<string, OperationViewModel[]>();

    for (const operation of this.filteredOperations()) {
      const items = groups.get(operation.groupLabel) ?? [];
      items.push(operation);
      groups.set(operation.groupLabel, items);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  });

  protected readonly hasOperations = computed(() => this.filteredOperations().length > 0);
  protected readonly hasActiveFilters = computed(() =>
    this.selectedTypeFilter() !== 'ALL'
    || this.selectedAccountFilter() !== 'ALL'
    || this.selectedPeriodFilter() !== 'ALL_TIME'
    || this.searchQuery().trim().length > 0
  );

  constructor() {
    if (!this.operationsService.hasOperations() && !this.operationsService.isLoading()) {
      this.operationsService.loadOperations();
    }

    if (!this.accountsService.hasAccounts() && !this.accountsService.isLoading()) {
      this.accountsService.loadAccounts();
    }

    if (!this.categoryService.hasCategories() && !this.categoryService.isLoading()) {
      this.categoryService.loadCategories();
    }
  }

  private toViewModel(operation: Operation): OperationViewModel {
    const category = this.findCategory(operation.categoryId);
    const account = this.findAccount(operation.accountId);
    const timestamp = operation.createdAt ? new Date(operation.createdAt) : null;
    const timeLabel = timestamp
      ? new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(timestamp)
      : null;
    const categoryLabel = category?.name ?? 'Без категории';
    const accountLabel = account ? this.getAccountLabel(account) : 'Без аккаунта';
    const currencyLabel = account?.currency?.trim() ?? '';
    const subtitleParts = [categoryLabel, accountLabel];

    if (timeLabel) {
      subtitleParts.push(timeLabel);
    }

    return {
      id: String(operation.id),
      title: operation.comment?.trim() || category?.name || (operation.type === 'INCOME' ? 'Доход' : 'Расход'),
      subtitle: subtitleParts.join(' • '),
      amountLabel: `${operation.type === 'INCOME' ? '+' : '-'}${Number(operation.amount).toFixed(2)}${currencyLabel ? ` ${currencyLabel}` : ''}`,
      amountClass: operation.type === 'INCOME' ? 'income' : 'expense',
      iconPath: MONEY_ICON_PATH,
      iconColor: MONEY_ICON_COLOR,
      backgroundColor: MONEY_ICON_BACKGROUND,
      groupLabel: this.getGroupLabel(timestamp),
      type: operation.type,
      accountId: operation.accountId != null ? String(operation.accountId) : '',
      createdAt: timestamp,
    };
  }

  protected selectTypeFilter(type: ActivityTypeFilter): void {
    this.selectedTypeFilter.set(type);
  }

  protected selectAccountFilter(accountId: string): void {
    this.selectedAccountFilter.set(accountId);
  }

  protected selectPeriodFilter(period: ActivityPeriodFilter): void {
    this.selectedPeriodFilter.set(period);
  }

  protected resetFilters(): void {
    this.selectedTypeFilter.set('ALL');
    this.selectedAccountFilter.set('ALL');
    this.selectedPeriodFilter.set('ALL_TIME');
    this.searchQuery.set('');
  }

  protected updateSearchQuery(value: string): void {
    this.searchQuery.set(value);
  }

  private getGroupLabel(date: Date | null): string {
    if (!date || Number.isNaN(date.getTime())) {
      return 'Без даты';
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffInDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

    if (diffInDays === 0) {
      return 'Today';
    }

    if (diffInDays === 1) {
      return 'Yesterday';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  private findCategory(categoryId?: number): Category | undefined {
    if (categoryId == null) {
      return undefined;
    }

    return this.categoryService.categories().find((category) => Number(category.id) === categoryId);
  }

  private findAccount(accountId?: number): Account | undefined {
    if (accountId == null) {
      return undefined;
    }

    return this.accountsService.accounts().find((account) => account.id === accountId);
  }

  private getAccountLabel(account: Account): string {
    if (account.type === 'CARD' && account.cardName) {
      return account.cardName;
    }

    return account.name;
  }

  private matchesTypeFilter(operation: Operation): boolean {
    const filter = this.selectedTypeFilter();
    return filter === 'ALL' ? true : operation.type === filter;
  }

  private matchesAccountFilter(operation: Operation): boolean {
    const filter = this.selectedAccountFilter();

    if (filter === 'ALL') {
      return true;
    }

    return String(operation.accountId ?? '') === filter;
  }

  private matchesPeriodFilter(operation: Operation): boolean {
    const filter = this.selectedPeriodFilter();

    if (filter === 'ALL_TIME') {
      return true;
    }

    if (!operation.createdAt) {
      return false;
    }

    const date = new Date(operation.createdAt);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();

    if (filter === 'THIS_MONTH') {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }

    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    return date >= last7Days;
  }

  private matchesSearchQuery(operation: OperationViewModel): boolean {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [
      operation.title,
      operation.subtitle,
      operation.amountLabel,
      operation.groupLabel,
    ].some((value) => value.toLowerCase().includes(query));
  }
}
