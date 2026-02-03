import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

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
  readonly userName = input<string>('John');
  readonly backRoute = input<string>('/home');

  protected readonly showProfileMenu = signal<boolean>(false);

  private readonly router = inject(Router);

  protected goBack(): void {
    void this.router.navigate([this.backRoute()]);
  }

  protected toggleProfileMenu(): void {
    this.showProfileMenu.update(value => !value);
  }
}
