import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AddButton } from '../add-button/add-button';
import { ActionMenu } from '../action-menu/action-menu';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, AddButton, ActionMenu],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  protected readonly isMenuOpen = signal(false);

  protected toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
