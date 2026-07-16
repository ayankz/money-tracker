import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './components/toast-container/toast-container';
import { AppUpdateService } from './services/app-update/app-update';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly appUpdateService = inject(AppUpdateService);

  constructor() {
    this.appUpdateService.listenForUpdates();
  }
}
