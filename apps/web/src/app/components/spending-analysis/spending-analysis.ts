import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-spending-analysis',
  imports: [DecimalPipe],
  templateUrl: './spending-analysis.html',
  styleUrl: './spending-analysis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpendingAnalysis {
  readonly monthlyBudget = input.required<number>();
  readonly spent = input.required<number>();

  protected readonly percentUsed = computed(() => {
    const budget = this.monthlyBudget();
    return budget > 0 ? this.spent() / budget : 0;
  });

  protected readonly percentUsedDisplay = computed(() =>
    Math.round(this.percentUsed() * 100)
  );
}
