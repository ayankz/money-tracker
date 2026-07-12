import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MoneyCardComponent, type MoneyCard } from '../money-card/money-card';

@Component({
  selector: 'app-accounts-section',
  imports: [MoneyCardComponent],
  templateUrl: './cards-section.html',
  styleUrl: './cards-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsSection {
  readonly accounts = input.required<ReadonlyArray<MoneyCard>>();
  readonly title = input<string>('Your accounts');
  readonly actionLabel = input<string>('Manage');
  readonly layout = input<'row' | 'stack'>('row');
  readonly showAddAccountTile = input<boolean>(true);
  readonly accountsClickable = input<boolean>(false);
  readonly showDelete = input<boolean>(false);

  readonly action = output<void>();
  readonly addAccount = output<void>();
  readonly removeAccount = output<number>();
  readonly accountClick = output<number>();

  protected onAction(): void {
    this.action.emit();
  }

  protected onAddAccount(): void {
    this.addAccount.emit();
  }

  protected onRemoveAccount(accountId: number): void {
    this.removeAccount.emit(accountId);
  }

  protected onAccountClick(accountId: number): void {
    this.accountClick.emit(accountId);
  }
}
