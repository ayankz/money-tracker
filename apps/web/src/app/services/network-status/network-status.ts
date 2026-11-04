import { Injectable, inject, signal } from '@angular/core';
import { fromEvent } from 'rxjs';
import { NotificationsService } from '../notifications/notifications';

@Injectable({
  providedIn: 'root',
})
export class NetworkStatusService {
  private readonly notifications = inject(NotificationsService);
  private readonly hasBrowserApi = typeof window !== 'undefined' && typeof navigator !== 'undefined';
  private isListening = false;

  readonly isOnline = signal<boolean>(this.hasBrowserApi ? navigator.onLine : true);

  start(): void {
    if (!this.hasBrowserApi || this.isListening) {
      return;
    }

    this.isListening = true;

    fromEvent(window, 'offline').subscribe(() => {
      this.isOnline.set(false);
      this.notifications.error('Нет подключения к интернету');
    });

    fromEvent(window, 'online').subscribe(() => {
      this.isOnline.set(true);
      this.notifications.success('Соединение восстановлено');
    });
  }
}
