import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { isApiRequest } from './api-request';

export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!isApiRequest(req.url)) return next(req);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401)
        return throwError(() => error);
      return auth.refresh().pipe(
        switchMap(() => next(req)),
        catchError((refreshError: unknown) => {
          auth.clearSession();
          void router.navigateByUrl('/auth');
          return throwError(() => refreshError);
        })
      );
    })
  );
};
