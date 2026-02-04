import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-add-button',
  imports: [NgClass],
  templateUrl: './add-button.html',
  styleUrl: './add-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddButton {
  readonly isRotated = input<boolean>(false);
  readonly clicked = output<void>();

  protected onClick(): void {
    this.clicked.emit();
  }
}
