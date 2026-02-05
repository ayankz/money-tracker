import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-field',
  imports: [FormsModule],
  templateUrl: './search-field.html',
  styleUrl: './search-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchField {
  // Inputs
  public readonly placeholder = input<string>('Search...');
  public readonly value = input<string>('');
  public readonly name = input<string>('search');

  // Outputs
  public readonly valueChange = output<string>();

  // Internal state
  protected readonly searchQuery = signal('');

  constructor() {
    // Sync initial value with internal state
    effect(() => {
      const initialValue = this.value();
      if (this.searchQuery() !== initialValue) {
        this.searchQuery.set(initialValue);
      }
    });
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.valueChange.emit(value);
  }
}