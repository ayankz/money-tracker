import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  HostListener,
  effect,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly title = input<string>('');
  readonly showBackButton = input<boolean>(false);
  readonly showProfile = input<boolean>(false);
  readonly userName = input<string>('');
  readonly fallbackRoute = input<string>('/home');

  protected readonly showProfileMenu = signal<boolean>(false);
  private readonly navigationHistoryExists = signal<boolean>(false);

  private readonly router = inject(Router);
  private readonly location = inject(Location);

  constructor() {
    // Track navigation history to safely use location.back()
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.navigationHistoryExists.set(true);
      });
  }

  protected goBack(): void {
    // Use browser history if available, otherwise fallback to specified route
    if (this.navigationHistoryExists()) {
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
