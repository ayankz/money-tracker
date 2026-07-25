import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { AppRefreshService } from '../../services/app-refresh/app-refresh';

@Component({
  selector: 'app-pull-to-refresh',
  templateUrl: './pull-to-refresh.html',
  styleUrl: './pull-to-refresh.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PullToRefresh {
  private readonly refreshThreshold = 72;
  private touchStartY = 0;

  protected readonly appRefreshService = inject(AppRefreshService);
  protected readonly pullDistance = signal(0);

  @HostListener('document:touchstart', ['$event'])
  protected onTouchStart(event: TouchEvent): void {
    if (this.shouldIgnoreTouch(event) || this.getScrollTop() > 0 || this.appRefreshService.isRefreshing()) {
      this.touchStartY = 0;
      return;
    }

    this.touchStartY = event.touches[0]?.clientY ?? 0;
  }

  @HostListener('document:touchmove', ['$event'])
  protected onTouchMove(event: TouchEvent): void {
    if (!this.touchStartY || this.getScrollTop() > 0 || this.appRefreshService.isRefreshing()) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? 0;
    const distance = Math.max(0, currentY - this.touchStartY);

    if (distance <= 0) {
      return;
    }

    this.pullDistance.set(Math.min(distance, 96));
  }

  @HostListener('document:touchend')
  @HostListener('document:touchcancel')
  protected onTouchEnd(): void {
    if (this.pullDistance() >= this.refreshThreshold) {
      this.appRefreshService.refresh();
    }

    this.touchStartY = 0;
    this.pullDistance.set(0);
  }

  private shouldIgnoreTouch(event: TouchEvent): boolean {
    const target = event.target as HTMLElement | null;

    return Boolean(
      target?.closest(
        'input, textarea, select, button, a, [contenteditable="true"], .entity-dropdown, .sheet-overlay'
      )
    );
  }

  private getScrollTop(): number {
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }
}
