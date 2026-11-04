import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AccountsService } from '../accounts/accounts';
import { AuthService } from '../auth.service';
import { CategoryService } from '../category.service';
import { NetworkStatusService } from '../network-status/network-status';
import { NotificationsService } from '../notifications/notifications';
import { OperationsService } from '../operations/operations';
import { TransfersService } from '../transfers/transfers';
import { UpcomingPaymentsService } from '../upcoming-payments/upcoming-payments';

@Injectable({
  providedIn: 'root',
})
export class AppRefreshService {
  private readonly accountsService = inject(AccountsService);
  private readonly authService = inject(AuthService);
  private readonly categoryService = inject(CategoryService);
  private readonly networkStatusService = inject(NetworkStatusService);
  private readonly notifications = inject(NotificationsService);
  private readonly operationsService = inject(OperationsService);
  private readonly transfersService = inject(TransfersService);
  private readonly upcomingPaymentsService = inject(UpcomingPaymentsService);

  readonly isRefreshing = signal(false);
  readonly isAnyDataLoading = computed(
    () =>
      this.accountsService.isLoading() ||
      this.categoryService.isLoading() ||
      this.operationsService.isLoading() ||
      this.operationsService.isOverviewLoading() ||
      this.transfersService.isLoading() ||
      this.upcomingPaymentsService.isLoading()
  );

  constructor() {
    effect(() => {
      if (!this.isRefreshing() || this.isAnyDataLoading()) {
        return;
      }

      this.isRefreshing.set(false);
    });
  }

  refresh(): void {
    if (!this.networkStatusService.isOnline()) {
      this.notifications.error('Нет подключения к интернету');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      return;
    }

    if (this.isRefreshing() || this.isAnyDataLoading()) {
      return;
    }

    this.isRefreshing.set(true);
    this.accountsService.loadAccounts();
    this.categoryService.loadCategories();
    this.operationsService.loadOperations();
    this.operationsService.loadOverview();
    this.transfersService.loadTransfers();
    this.upcomingPaymentsService.loadPayments();
  }
}
