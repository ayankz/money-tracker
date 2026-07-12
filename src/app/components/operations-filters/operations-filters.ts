import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ActivityTypeFilter = 'ALL' | 'INCOME' | 'EXPENSE';
export type ActivityPeriodFilter = 'THIS_MONTH' | 'LAST_7_DAYS' | 'ALL_TIME';

export interface OperationsFilterOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-operations-filters',
  imports: [],
  templateUrl: './operations-filters.html',
  styleUrl: './operations-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsFilters {
  readonly selectedType = input.required<ActivityTypeFilter>();
  readonly selectedAccount = input.required<string>();
  readonly selectedPeriod = input.required<ActivityPeriodFilter>();
  readonly typeFilters = input.required<ReadonlyArray<OperationsFilterOption>>();
  readonly accountFilters = input.required<ReadonlyArray<OperationsFilterOption>>();
  readonly periodFilters = input.required<ReadonlyArray<OperationsFilterOption>>();
  readonly showReset = input<boolean>(false);

  readonly typeSelected = output<ActivityTypeFilter>();
  readonly accountSelected = output<string>();
  readonly periodSelected = output<ActivityPeriodFilter>();
  readonly resetClicked = output<void>();

  protected selectType(value: string): void {
    this.typeSelected.emit(value as ActivityTypeFilter);
  }

  protected selectAccount(value: string): void {
    this.accountSelected.emit(value);
  }

  protected selectPeriod(value: string): void {
    this.periodSelected.emit(value as ActivityPeriodFilter);
  }

  protected resetFilters(): void {
    this.resetClicked.emit();
  }
}
