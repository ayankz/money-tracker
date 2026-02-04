import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-color-picker',
  imports: [NgClass],
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPicker {
  readonly selectedColor = input<string>('#ffdce3');
  readonly colorSelected = output<string>();

  protected readonly colors = [
    { name: 'pink', value: '#ffdce3' },
    { name: 'blue', value: '#dcefff' },
    { name: 'green', value: '#e0f8e9' },
    { name: 'orange', value: '#fff0e0' },
    { name: 'yellow', value: '#fdf8e1' },
    { name: 'purple', value: '#ede8f3' },
    { name: 'teal', value: '#e0f7f9' },
    { name: 'peach', value: '#ffeadb' },
  ];

  protected onColorSelect(color: string): void {
    this.colorSelected.emit(color);
  }
}