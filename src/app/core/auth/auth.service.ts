import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, of, shareReplay, tap, catchError } from 'rxjs';
import { API_BASE, silent } from '../api/api.config';
import { AuthResponse, RefreshResponse, UserData } from '../api/models';

const ACCESS = 'hg.access';
const REFRESH = 'hg.refresh';
const USER = 'hg.user';
const ROLE_CLAIMS = ['http://schemas.microsoft.com/ws/2008/06/identity/claims/role', 'role', 'roles'];

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
  }
}

export function roleFromJwt(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(decodeURIComponent(escape(atob(payload)))) as Record<string, unknown>;
    for (const claim of ROLE_CLAIMS) {
      const v = json[claim];
      if (typeof v === 'string') return v;
      if (Array.isArray(v) && v.length) return String(v[0]);
    }
  } catch {
  }
  return null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE);
  private readonly router = inject(Router);

  readonly accessToken = signal<string | null>(read(ACCESS));
  readonly refreshToken = signal<string | null>(read(REFRESH));
  readonly user = signal<UserData | null>(this.loadUser());
  readonly isLoggedIn = computed(() => !!this.accessToken() && !!this.user());
  readonly role = computed(() => this.user()?.userRole || roleFromJwt(this.accessToken()));
  readonly isAdmin = computed(() => this.role() === 'Admin');
  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    return ((u.name?.[0] ?? '') + (u.surname?.[0] ?? u.email?.[0] ?? '')).toUpperCase();
  });
  readonly fullName = computed(() => {
    const u = this.user();
    return u ? [u.name, u.surname].filter(Boolean).join(' ') : '';
  });

  private refreshing$: Observable<string> | null = null;

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/Auth/login`, { email, password }, { context: silent() })
      .pipe(tap((res) => this.setSession(res.accessToken, res.refreshToken, res.user)));
  }

  register(body: { email: string; name: string; surname?: string; password: string }) {
    return this.http.post<{ message?: string }>(`${this.base}/Auth/register`, body, { context: silent() });
  }

  forgotPassword(email: string) {
    const params = new HttpParams().set('email', email);
    return this.http.post<{ message?: string }>(`${this.base}/Auth/forgot-password`, null, { params, context: silent() });
  }

  resetPassword(body: { userId: string; token: string; password: string }) {
    return this.http.post<{ message?: string }>(`${this.base}/Auth/reset-password`, body, { context: silent() });
  }

  confirmEmail(userId: string, token: string) {
    const params = new HttpParams().set('userId', userId).set('token', token);
    return this.http.post<{ message?: string }>(`${this.base}/Auth/confirm-email`, null, { params, context: silent() });
  }

  changePassword(body: { previousPassword: string; newPassword: string; confirmPassword: string }) {
    return this.http.post<{ message?: string }>(`${this.base}/Auth/change-password`, body, { context: silent() });
  }

  refresh(): Observable<string> {
    const refreshToken = this.refreshToken();
    if (!refreshToken) return new Observable<string>((s) => s.error(new Error('no refresh token')));
    if (!this.refreshing$) {
      this.refreshing$ = this.http
        .post<RefreshResponse>(`${this.base}/Auth/refresh`, { refreshToken }, { context: silent() })
        .pipe(
          tap((res) => {
            this.accessToken.set(res.accessToken);
            write(ACCESS, res.accessToken);
            if (res.user) this.storeUser(res.user);
          }),
          map((res) => res.accessToken),
          finalize(() => (this.refreshing$ = null)),
          shareReplay(1),
        );
    }
    return this.refreshing$;
  }

  logout(redirect = true): void {
    const refreshToken = this.refreshToken();
    if (refreshToken && this.accessToken()) {
      this.http
        .post(`${this.base}/Auth/logout`, { refreshToken }, { context: silent() })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
    this.clear();
    if (redirect) void this.router.navigate(['/login']);
  }

  expire(): void {
    this.clear();
    void this.router.navigate(['/login'], { queryParams: { expired: 1 } });
  }

  private clear(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
    write(ACCESS, null);
    write(REFRESH, null);
    write(USER, null);
  }

  private setSession(access: string, refresh: string, user: UserData): void {
    this.accessToken.set(access);
    this.refreshToken.set(refresh);
    write(ACCESS, access);
    write(REFRESH, refresh);
    this.storeUser(user);
  }

  private storeUser(user: UserData): void {
    const merged = { ...user, userRole: user.userRole || roleFromJwt(this.accessToken()) };
    this.user.set(merged);
    write(USER, JSON.stringify(merged));
  }

  private loadUser(): UserData | null {
    const raw = read(USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserData;
    } catch {
      return null;
    }
  }
}
