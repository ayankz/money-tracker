import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AddButton } from '../add-button/add-button';
import { ActionMenu, type ActionType } from '../action-menu/action-menu';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, AddButton, ActionMenu],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly router = inject(Router);

  protected readonly isMenuOpen = signal(false);

  protected toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected onActionSelected(action: ActionType): void {
    this.closeMenu();

    switch (action) {
      case 'card':
        this.router.navigate(['/add-card']);
        break;
      case 'category':
        this.router.navigate(['/add-category']);
        break;
      case 'transaction':
        this.router.navigate(['/add-transaction']);
        break;
      case 'import':
        // TODO: Implement import functionality
        console.log('Import statement action');
        break;
    }
  }
}
