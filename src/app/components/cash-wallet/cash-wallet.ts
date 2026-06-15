import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-cash-wallet',
  imports: [DecimalPipe],
  templateUrl: './cash-wallet.html',
  styleUrl: './cash-wallet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashWallet {
  readonly balance = input.required<number>();
  readonly topUp = output<void>();

  protected onTopUp(): void {
    this.topUp.emit();
  }
}
