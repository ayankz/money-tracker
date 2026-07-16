import { inject } from '@angular/core';
import { HttpErrorResponse, type HttpInterceptorFn, type HttpRequest } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { NotificationsService } from '../services/notifications/notifications';

interface BackendErrorResponse {
  readonly message: string;
}

const NETWORK_ERROR_MESSAGE = 'Нет подключения к интернету';
const DEFAULT_ERROR_MESSAGE = 'Не удалось выполнить запрос';

function shouldSkipNotification(req: HttpRequest<unknown>): boolean {
  return !req.url.startsWith('/api') || req.url.includes('/api/auth/refresh');
}

function isNetworkError(error: HttpErrorResponse): boolean {
  return error.status === 0;
}

function getErrorMessage(error: HttpErrorResponse): string {
  const payload = error.error as BackendErrorResponse | null;

  // Angular uses status 0 when the request failed before any HTTP response arrived.
  if (isNetworkError(error)) {
    return NETWORK_ERROR_MESSAGE;
  }

  return payload?.message?.trim() || DEFAULT_ERROR_MESSAGE;
}

export const errorNotificationInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationsService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !shouldSkipNotification(req)) {
        notifications.error(getErrorMessage(error));
      }

      return throwError(() => error);
    })
  );
};
