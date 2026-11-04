import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, AuthSession } from '../../services/auth.service';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-profile',
  imports: [Header, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly profileName = signal('Profile');
  protected readonly profileEmail = signal('');
  protected readonly sessions = signal<AuthSession[]>([]);
  protected readonly showSessions = signal(false);
  protected readonly busy = signal(false);
  protected readonly message = signal<string | null>(null);

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: (user) => {
        this.profileEmail.set(user.email);
        this.profileName.set(user.email.split('@')[0]);
      },
      error: () => this.message.set('Unable to load your profile.'),
    });
  }
  protected openSettings(): void {
    this.showSessions.set(true);
    this.loadSessions();
  }
  private loadSessions(): void {
    this.busy.set(true);
    this.auth.sessions().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.busy.set(false);
      },
      error: () => {
        this.message.set('Unable to load sessions.');
        this.busy.set(false);
      },
    });
  }
  protected revoke(session: AuthSession): void {
    this.busy.set(true);
    this.message.set(null);
    this.auth.revokeSession(session).subscribe({
      next: () => {
        if (session.current) void this.router.navigateByUrl('/auth');
        else this.loadSessions();
      },
      error: () => {
        this.message.set('Unable to revoke this session.');
        this.busy.set(false);
      },
    });
  }
  protected logout(all = false): void {
    this.busy.set(true);
    this.message.set(null);
    (all ? this.auth.logoutAll() : this.auth.logout()).subscribe({
      next: () => {
        void this.router.navigateByUrl('/auth', { replaceUrl: true });
      },
      error: () => {
        this.message.set('Unable to sign out. Please try again.');
        this.busy.set(false);
      },
    });
  }
}
