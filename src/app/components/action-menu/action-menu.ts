import { ChangeDetectionStrategy, Component, HostListener, output, signal, AfterViewInit, ElementRef, inject } from '@angular/core';

export type ActionType = 'import' | 'category' | 'account' | 'transaction' | 'upcomingPayment';

export interface MenuAction {
  type: ActionType;
  label: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-action-menu',
  imports: [],
  templateUrl: './action-menu.html',
  styleUrl: './action-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionMenu implements AfterViewInit {
  private readonly elementRef = inject(ElementRef);

  readonly close = output<void>();
  readonly actionSelected = output<ActionType>();

  protected readonly actions = signal<MenuAction[]>([
    {
      type: 'import',
      label: 'Import Statement',
      ariaLabel: 'Import bank statement'
    },
    {
      type: 'category',
      label: 'New Category',
      ariaLabel: 'Create new category'
    },
    {
      type: 'account',
      label: 'Add Account',
      ariaLabel: 'Add account'
    },
    {
      type: 'transaction',
      label: 'Add Transaction',
      ariaLabel: 'Add new transaction'
    },
    {
      type: 'upcomingPayment',
      label: 'Add Upcoming Payment',
      ariaLabel: 'Add upcoming payment'
    }
  ]);

  ngAfterViewInit(): void {
    // Focus first action button for keyboard accessibility
    const firstButton = this.elementRef.nativeElement.querySelector('.action-item');
    firstButton?.focus();
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    this.close.emit();
  }

  protected onBackdropClick(): void {
    this.close.emit();
  }

  protected onActionClick(action: ActionType): void {
    this.actionSelected.emit(action);
    this.close.emit();
  }

  protected trackByType(_index: number, action: MenuAction): ActionType {
    return action.type;
  }
}
