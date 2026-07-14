import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { OperationsService } from '../../services/operations/operations';
import type { OperationOverviewPeriod } from '../../store/operations.store';

interface FinancialOverviewValue {
  readonly currency: string;
  readonly amount: number;
}

interface FinancialOverviewMetric {
  readonly label: string;
  readonly kind: 'earnings' | 'spending';
  readonly icon: string;
  readonly values: ReadonlyArray<FinancialOverviewValue>;
}

@Component({
  selector: 'app-financial-overview',
  templateUrl: './financial-overview.html',
  styleUrl: './financial-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialOverview {
  private readonly operationsService = inject(OperationsService);

  protected readonly overview = this.operationsService.overview;
  protected readonly isLoading = this.operationsService.isOverviewLoading;
  protected readonly metricColumns = computed<ReadonlyArray<ReadonlyArray<FinancialOverviewMetric>>>(() => {
    const overview = this.overview();

    if (!overview) {
      return [];
    }

    return [
      [
        this.toMetric('Weekly Earnings', 'earnings', '/icons/arrow-up.svg', overview.week, 'income'),
        this.toMetric('Monthly Earnings', 'earnings', '/icons/arrow-up.svg', overview.month, 'income'),
      ],
      [
        this.toMetric('Weekly Spending', 'spending', '/icons/arrow-down.svg', overview.week, 'expense'),
        this.toMetric('Monthly Spending', 'spending', '/icons/arrow-down.svg', overview.month, 'expense'),
      ],
    ];
  });

  constructor() {
    if (!this.operationsService.hasOverviewLoaded() && !this.operationsService.isOverviewLoading()) {
      this.operationsService.loadOverview();
    }
  }

  protected formatAmount(value: FinancialOverviewValue): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: value.currency || 'KZT',
      maximumFractionDigits: 2,
    }).format(Number(value.amount));
  }

  private toMetric(
    label: string,
    kind: 'earnings' | 'spending',
    icon: string,
    period: OperationOverviewPeriod,
    field: 'income' | 'expense'
  ): FinancialOverviewMetric {
    return {
      label,
      kind,
      icon,
      values: period.totals
        .map((total) => ({
          currency: total.currency,
          amount: Number(total[field]),
        }))
        .filter((value) => value.amount !== 0),
    };
  }
}
