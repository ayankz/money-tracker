import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OfflineBanner } from './components/offline-banner/offline-banner';
import { ToastContainer } from './components/toast-container/toast-container';
import { AppUpdateService } from './services/app-update/app-update';
import { NetworkStatusService } from './services/network-status/network-status';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, OfflineBanner],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly appUpdateService = inject(AppUpdateService);
  private readonly networkStatusService = inject(NetworkStatusService);

  constructor() {
    this.appUpdateService.listenForUpdates();
    this.networkStatusService.start();
  }
}
