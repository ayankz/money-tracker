import { ChangeDetectionStrategy, Component, HostListener, output, signal, AfterViewInit, ElementRef, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type ActionType = 'import' | 'category' | 'card' | 'transaction';

export interface MenuAction {
  type: ActionType;
  label: string;
  iconSvg: SafeHtml;
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
  private readonly sanitizer = inject(DomSanitizer);

  readonly close = output<void>();
  readonly actionSelected = output<ActionType>();

  protected readonly actions = signal<MenuAction[]>([
    {
      type: 'import',
      label: 'Import Statement',
      iconSvg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'),
      ariaLabel: 'Import bank statement'
    },
    {
      type: 'category',
      label: 'New Category',
      iconSvg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'),
      ariaLabel: 'Create new category'
    },
    {
      type: 'card',
      label: 'Add Card',
      iconSvg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x="1" y1="10" x2="23" y2="10"/></svg>'),
      ariaLabel: 'Add credit or debit card'
    },
    {
      type: 'transaction',
      label: 'Add Transaction',
      iconSvg: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'),
      ariaLabel: 'Add new transaction'
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
