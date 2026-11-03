import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { I18n } from '../i18n/i18n.service';
import { ToastService } from '../toast/toast.service';
import { API_BASE, SILENT_ERRORS } from './api.config';
import { ApiError } from './api-error';

const PUBLIC_PATHS = ['/Auth/login', '/Auth/register', '/Auth/refresh', '/Auth/forgot-password', '/Auth/reset-password', '/Auth/confirm-email'];

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const base = inject(API_BASE);
  if (!req.url.startsWith(base)) return next(req);

  const auth = inject(AuthService);
  const i18n = inject(I18n);
  const toasts = inject(ToastService);
  const isPublic = PUBLIC_PATHS.some((p) => req.url.startsWith(base + p));

  const withHeaders = (token: string | null): HttpRequest<unknown> =>
    req.clone({
      setHeaders: {
        'Accept-Language': i18n.acceptLanguage(),
        ...(token && !isPublic ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  const fail = (e: unknown) => {
    const apiError = ApiError.from(e);
    if (!req.context.get(SILENT_ERRORS)) toasts.error(apiError);
    return throwError(() => apiError);
  };

  return next(withHeaders(auth.accessToken())).pipe(
    catchError((e: unknown) => {
      const is401 = e instanceof HttpErrorResponse && e.status === 401;
      if (is401 && !isPublic && auth.refreshToken()) {
        return auth.refresh().pipe(
          switchMap((token) => next(withHeaders(token))),
          catchError((inner: unknown) => {
            const innerStatus = inner instanceof HttpErrorResponse ? inner.status : 0;
            if (innerStatus === 401 || innerStatus === 400 || !(inner instanceof HttpErrorResponse)) {
              auth.expire();
              toasts.warning(i18n.t('error.sessionExpired'));
              return throwError(() => ApiError.from(inner));
            }
            return fail(inner);
          }),
        );
      }
      if (is401 && !isPublic && auth.isLoggedIn()) {
        auth.expire();
        toasts.warning(i18n.t('error.sessionExpired'));
        return throwError(() => ApiError.from(e));
      }
      return fail(e);
    }),
  );
};
