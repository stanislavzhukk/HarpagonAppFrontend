import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { ApiError } from '../../core/api/api-error';
import { UserData } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { I18n } from '../../core/i18n/i18n.service';
import { ToastService } from '../../core/toast/toast.service';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { UsersService } from './users.service';

const SIZE = 10;

@Component({
  selector: 'hg-users',
  imports: [PageHeaderComponent, IconComponent, ModalComponent, ErrorBannerComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hg-page-header [title]="t('nav.users')" [subtitle]="t('admin.subtitle')" />
    <section class="card p-5">
      <div class="input max-w-md"><hg-icon name="search" [size]="16" class="text-ink-3" /><input [placeholder]="t('admin.searchPh')" (input)="onSearch($any($event.target).value)" [attr.aria-label]="t('filter.search')" /></div>
    </section>
    <section class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl min-w-[640px]">
          <thead><tr><th>{{ t('admin.user') }}</th><th>{{ t('field.email') }}</th><th>{{ t('admin.status') }}</th><th>{{ t('admin.role') }}</th><th class="w-40"></th></tr></thead>
          <tbody>
            @for (u of rows(); track u.id) {
              <tr>
                <td><span class="flex items-center gap-3"><span class="ico-ch sm">{{ initials(u) }}</span><b class="font-medium">{{ u.name }} {{ u.surname }}</b></span></td>
                <td class="text-ink-2">{{ u.email }}</td>
                <td><span class="badge" [class.badge-income]="u.emailConfirmed" [class.badge-brass]="!u.emailConfirmed">{{ u.emailConfirmed ? t('admin.confirmed') : t('admin.awaiting') }}</span></td>
                <td><span class="badge" [class.badge-brass]="u.userRole === 'Admin'">{{ u.userRole || 'User' }}</span></td>
                <td class="text-right">
                  @if (u.userRole === 'Admin' || u.id === auth.user()?.id) {
                    <hg-icon name="lock" [size]="16" class="text-ink-3" />
                  } @else {
                    <span class="inline-flex items-center gap-3">
                      <a class="text-[13px] font-medium text-info" [routerLink]="['/admin/users', u.id, 'transactions']">{{ t('nav.transactions') }}</a>
                      <button type="button" class="p-1 text-ink-3 hover:text-danger" [attr.aria-label]="t('common.delete')" (click)="deleting.set(u)"><hg-icon name="trash" [size]="16" /></button>
                    </span>
                  }
                </td>
              </tr>
            } @empty { <tr><td colspan="5" class="!h-auto py-12 text-center text-ink-3">{{ loading() ? t('common.loading') : t('admin.empty') }}</td></tr> }
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between border-t border-line px-6 py-4">
        <span class="text-[13px] text-ink-2">{{ t('admin.total', { n: total() }) }}</span>
        <div class="flex gap-2">
          <button type="button" class="pg" [disabled]="page() === 0" [attr.aria-label]="t('common.prev')" (click)="page.set(page() - 1)"><hg-icon name="chevL" [size]="14" /></button>
          <span class="pg on">{{ page() + 1 }}</span>
          <button type="button" class="pg" [disabled]="page() >= pagesCount() - 1" [attr.aria-label]="t('common.next')" (click)="page.set(page() + 1)"><hg-icon name="chevR" [size]="14" /></button>
        </div>
      </div>
    </section>

    @if (deleting(); as d) {
      <hg-modal [heading]="t('admin.deleteQ', { name: d.name + ' ' + d.surname })" (closed)="deleting.set(null)">
        <p class="text-ink-2">{{ t('admin.deleteHint') }}</p>
        <hg-error-banner [error]="error()" />
        <div class="flex justify-end gap-3"><button type="button" class="btn btn-secondary" (click)="deleting.set(null)">{{ t('common.cancel') }}</button><button type="button" class="btn btn-danger" [disabled]="busy()" (click)="confirmDelete()">{{ t('common.delete') }}</button></div>
      </hg-modal>
    }
  `,
})
export class UsersComponent {
  protected readonly t = inject(I18n).t;
  protected readonly auth = inject(AuthService);
  private readonly api = inject(UsersService);
  private readonly toasts = inject(ToastService);

  protected readonly search = signal('');
  protected readonly page = signal(0);
  private readonly reload = signal(0);
  protected readonly rows = signal<UserData[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly deleting = signal<UserData | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly pagesCount = computed(() => Math.max(1, Math.ceil(this.total() / SIZE)));
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const q = computed(() => ({ page: this.page(), search: this.search(), r: this.reload() }));
    toObservable(q)
      .pipe(
        debounceTime(100),
        tap(() => this.loading.set(true)),
        switchMap((v) => this.api.page(v.page * SIZE, SIZE, v.search.trim() || undefined).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res) return;
        this.rows.set(res.data);
        this.total.set(res.recordsFiltered);
      });
  }

  protected initials(u: UserData): string {
    return ((u.name?.[0] ?? '') + (u.surname?.[0] ?? '')).toUpperCase() || '?';
  }

  protected onSearch(v: string): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.search.set(v); this.page.set(0); }, 250);
  }

  protected confirmDelete(): void {
    const d = this.deleting();
    if (!d) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.remove(d.id).subscribe({
      next: () => { this.busy.set(false); this.deleting.set(null); this.toasts.success(this.t('admin.deleted')); this.reload.update((n) => n + 1); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e); },
    });
  }
}
