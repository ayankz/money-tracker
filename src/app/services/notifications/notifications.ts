import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'success' | 'error' | 'info';

export interface NotificationItem {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly message: string;
  readonly closing: boolean;
  readonly action?: NotificationAction;
}

export interface NotificationAction {
  readonly label: string;
  readonly handler: () => void;
}

export interface NotificationOptions {
  readonly action?: NotificationAction;
  readonly durationMs?: number | null;
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

  success(message = 'Success!', options?: NotificationOptions): void {
    this.show('success', message, options);
  }

  error(message: string, options?: NotificationOptions): void {
    this.show('error', message, options);
  }

  info(message: string, options?: NotificationOptions): void {
    this.show('info', message, options);
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

  runAction(item: NotificationItem): void {
    if (!item.action) {
      return;
    }

    item.action.handler();
    this.dismiss(item.id);
  }

  private show(kind: NotificationKind, message: string, options?: NotificationOptions): void {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      return;
    }

    const id = crypto.randomUUID();
    this.items.update((items) => [
      ...items,
      { id, kind, message: normalizedMessage, closing: false, action: options?.action },
    ]);

    if (options?.durationMs === null) {
      return;
    }

    const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
    const dismissTimer = setTimeout(() => {
      this.dismiss(id);
    }, durationMs);

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
