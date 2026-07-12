import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-entity-form-shell',
  imports: [ReactiveFormsModule],
  templateUrl: './entity-form-shell.html',
  styleUrl: './entity-form-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityFormShell {
  readonly formGroup = input.required<FormGroup>();
  readonly ariaLabel = input<string>('Entity form');
  readonly submitted = output<void>();

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
