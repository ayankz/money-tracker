import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
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
  private readonly router = inject(Router);

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    this.close();
  }

  protected onBackdropClick(): void {
    this.close();
  }

  protected close(): void {
    this.router.navigate([{ outlets: { sheet: null } }], { replaceUrl: true });
  }
}
