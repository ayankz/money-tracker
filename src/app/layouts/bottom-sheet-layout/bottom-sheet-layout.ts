import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-bottom-sheet-layout',
  imports: [RouterOutlet],
  templateUrl: './bottom-sheet-layout.html',
  styleUrl: './bottom-sheet-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetLayout {
  private readonly closeThreshold = 88;
  private touchStartY = 0;
  private touchStartScrollTop = 0;

  private readonly router = inject(Router);

  protected readonly dragOffset = signal(0);
  protected readonly isDragging = signal(false);
  protected readonly overlayOpacity = computed(() => {
    const opacity = 0.38 - this.dragOffset() / 600;

    return Math.max(0.08, opacity);
  });

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    this.close();
  }

  protected onBackdropClick(): void {
    this.close();
  }

  protected onSheetTouchStart(event: TouchEvent): void {
    event.stopPropagation();

    const panel = event.currentTarget as HTMLElement;
    this.touchStartY = event.touches[0]?.clientY ?? 0;
    this.touchStartScrollTop = panel.scrollTop;
    this.dragOffset.set(0);
    this.isDragging.set(false);
  }

  protected onSheetTouchMove(event: TouchEvent): void {
    event.stopPropagation();

    if (!this.touchStartY || this.touchStartScrollTop > 0) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? 0;
    const distance = currentY - this.touchStartY;

    if (distance <= 0) {
      return;
    }

    event.preventDefault();
    this.isDragging.set(true);
    this.dragOffset.set(Math.min(distance, this.getMaxDragOffset()));
  }

  protected onSheetTouchEnd(event: TouchEvent): void {
    event.stopPropagation();

    if (this.dragOffset() >= this.closeThreshold) {
      this.close();
      return;
    }

    this.touchStartY = 0;
    this.touchStartScrollTop = 0;
    this.dragOffset.set(0);
    this.isDragging.set(false);
  }

  protected close(): void {
    this.router.navigate([{ outlets: { sheet: null } }], { replaceUrl: true });
  }

  private getMaxDragOffset(): number {
    return Math.max(globalThis.innerHeight - 40, 360);
  }
}
