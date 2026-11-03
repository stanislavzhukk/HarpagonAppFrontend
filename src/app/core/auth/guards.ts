import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AccountsService } from '../../features/accounts/accounts.service';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

const homeFor = (auth: AuthService) => (auth.isAdmin() ? '/admin/users' : '/dashboard');

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).createUrlTree([homeFor(auth)]) : true;
};

export const homeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return router.createUrlTree([auth.isLoggedIn() ? homeFor(auth) : '/login']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAdmin() ? true : inject(Router).createUrlTree(['/dashboard']);
};

export const userGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAdmin() ? inject(Router).createUrlTree(['/admin/users']) : true;
};

export const hasAccountsGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AccountsService)
    .list()
    .pipe(
      map((list) => (list.length > 0 ? true : router.createUrlTree(['/setup']))),
      catchError(() => of(true)),
    );
};

export const needsSetupGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AccountsService)
    .list()
    .pipe(
      map((list) => (list.length === 0 ? true : router.createUrlTree(['/dashboard']))),
      catchError(() => of(true)),
    );
};
