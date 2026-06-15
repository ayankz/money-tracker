import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NoDataYetPipe } from './no-data-yet.pipe';

@Component({
  selector: 'app-financial-overview',
  imports: [DecimalPipe, NoDataYetPipe],
  templateUrl: './financial-overview.html',
  styleUrl: './financial-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialOverview {
  readonly weeklyEarnings = input<number>(0);
  readonly monthlyEarnings = input<number>(0);
  readonly weeklySpending = input<number>(0);
  readonly monthlySpending = input<number>(0);
}
