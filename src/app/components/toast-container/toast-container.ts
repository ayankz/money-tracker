import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationsService } from '../../services/notifications/notifications';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  protected readonly notifications = inject(NotificationsService);
}
