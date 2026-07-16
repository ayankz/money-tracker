import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { NotificationsService } from '../notifications/notifications';

@Injectable({
  providedIn: 'root',
})
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly notifications = inject(NotificationsService);

  listenForUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.notifications.info('Доступна новая версия приложения', {
          durationMs: null,
          action: {
            label: 'Обновить',
            handler: () => {
              this.swUpdate.activateUpdate().then(() => {
                document.location.reload();
              });
            },
          },
        });
      });
  }
}
