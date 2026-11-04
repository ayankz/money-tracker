import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly variant = input<'default' | 'logo'>('default');
  readonly appearance = input<'default' | 'glass'>('default');
  readonly title = input<string>('');
  readonly showBackButton = input<boolean>(false);
  readonly showProfile = input<boolean>(false);
  readonly userName = input<string>('');
  readonly fallbackRoute = input<string>('/home');
  readonly logoName = input<string>('TabysPro');
  readonly showActionButton = input<boolean>(false);
  readonly actionIconSrc = input<string>('');
  readonly actionAriaLabel = input<string>('Open action');
  readonly actionClick = output<void>();

  protected readonly showProfileMenu = signal<boolean>(false);

  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected goBack(): void {
    const historyState = this.location.getState() as { navigationId?: number } | null;
    const canUseBrowserBack =
      typeof historyState?.navigationId === 'number' && historyState.navigationId > 1;

    if (canUseBrowserBack) {
      this.location.back();
    } else {
      this.router.navigate([this.fallbackRoute()]).catch((error) => {
        console.error('Navigation failed:', error);
      });
    }
  }

  protected toggleProfileMenu(): void {
    this.showProfileMenu.update((value) => !value);
  }

  protected onActionClick(): void {
    this.actionClick.emit();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const profileButton = target.closest('.profile-button');
    const profileMenu = target.closest('.profile-menu');

    if (!profileButton && !profileMenu && this.showProfileMenu()) {
      this.showProfileMenu.set(false);
    }
  }
}
