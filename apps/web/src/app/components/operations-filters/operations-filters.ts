import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Account } from '../../models/account.model';
import type { OperationType } from '../../store/operations.store';

export type OperationTypeFilter = OperationType | 'ALL';
export type OperationPeriodFilter = 'ALL' | 'MONTH' | 'LAST_7_DAYS';

@Component({
  selector: 'app-operations-filters',
  templateUrl: './operations-filters.html',
  styleUrl: './operations-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsFilters {
  readonly accounts = input<ReadonlyArray<Account>>([]);
  readonly selectedType = input<OperationTypeFilter>('ALL');
  readonly selectedAccountId = input<string>('ALL');
  readonly selectedPeriod = input<OperationPeriodFilter>('ALL');

  readonly typeChange = output<OperationTypeFilter>();
  readonly accountChange = output<string>();
  readonly periodChange = output<OperationPeriodFilter>();
  readonly resetFilters = output<void>();

  protected readonly typeOptions = [
    { value: 'ALL', label: 'Все' },
    { value: 'INCOME', label: 'Доходы' },
    { value: 'EXPENSE', label: 'Расходы' },
  ] as const;

  protected readonly periodOptions = [
    { value: 'ALL', label: 'All time' },
    { value: 'MONTH', label: 'This month' },
    { value: 'LAST_7_DAYS', label: 'Last 7 days' },
  ] as const;

  protected getAccountLabel(account: Account): string {
    if (account.type === 'CARD' && account.cardName) {
      return account.digits ? `${account.cardName} •• ${account.digits}` : account.cardName;
    }

    return account.name || 'Account';
  }
}
