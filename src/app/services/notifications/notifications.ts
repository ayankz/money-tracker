import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'success' | 'error' | 'info';

export interface NotificationItem {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly message: string;
  readonly closing: boolean;
}

const DEFAULT_DURATION_MS = 3000;
const EXIT_DURATION_MS = 250;

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  readonly items = signal<ReadonlyArray<NotificationItem>>([]);

  private readonly dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly removeTimers = new Map<string, ReturnType<typeof setTimeout>>();

  success(message = 'Success!'): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: string): void {
    const item = this.items().find((entry) => entry.id === id);
    if (!item || item.closing) {
      return;
    }

    this.clearTimer(this.dismissTimers, id);
    this.items.update((items) =>
      items.map((entry) => (entry.id === id ? { ...entry, closing: true } : entry))
    );

    const removeTimer = setTimeout(() => {
      this.items.update((items) => items.filter((entry) => entry.id !== id));
      this.clearTimer(this.removeTimers, id);
    }, EXIT_DURATION_MS);

    this.removeTimers.set(id, removeTimer);
  }

  private show(kind: NotificationKind, message: string): void {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      return;
    }

    const id = crypto.randomUUID();
    this.items.update((items) => [...items, { id, kind, message: normalizedMessage, closing: false }]);

    const dismissTimer = setTimeout(() => {
      this.dismiss(id);
    }, DEFAULT_DURATION_MS);

    this.dismissTimers.set(id, dismissTimer);
  }

  private clearTimer(
    store: Map<string, ReturnType<typeof setTimeout>>,
    id: string
  ): void {
    const timer = store.get(id);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    store.delete(id);
  }
}
