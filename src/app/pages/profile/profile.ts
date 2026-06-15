import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Header } from '../../components/header/header';

interface ProfileSetting {
  id: number;
  title: string;
  icon: 'security' | 'notifications' | 'link' | 'support';
  accent: 'purple' | 'peach' | 'green' | 'lavender';
}

@Component({
  selector: 'app-profile',
  imports: [Header],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly profileName = signal('John Doe');
  protected readonly profileEmail = signal('john.doe@example.com');

  protected readonly settings: ProfileSetting[] = [
    { id: 1, title: 'Security', icon: 'security', accent: 'purple' },
    { id: 2, title: 'Notifications', icon: 'notifications', accent: 'peach' },
    { id: 3, title: 'Linked Accounts', icon: 'link', accent: 'green' },
    { id: 4, title: 'Support', icon: 'support', accent: 'lavender' },
  ];

  protected openSettings(): void {
    console.log('Open profile settings');
    // TODO: Implement profile settings flow
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        void this.router.navigateByUrl('/auth', { replaceUrl: true });
      },
      error: (error) => {
        console.error('Logout failed:', error);
      },
    });
  }

  protected trackById(_: number, item: ProfileSetting): number {
    return item.id;
  }
}
