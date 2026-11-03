import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { I18n, TranslationKey } from '../core/i18n/i18n.service';
import { IconComponent, IconName } from '../shared/ui/icon.component';
import { LogoComponent } from '../shared/ui/logo.component';

interface NavItem { path: string; icon: IconName; label: TranslationKey }

@Component({
  selector: 'hg-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen">
      <aside class="sticky top-0 hidden h-screen w-[248px] flex-none flex-col gap-1 border-r border-line bg-nav px-4 pt-6 pb-5 lg:flex">
        <div class="px-3 pb-7"><hg-logo [onDark]="true" />@if (auth.isAdmin()) { <span class="badge badge-brass mt-3">{{ t('admin.panel') }}</span> }</div>
        @for (item of nav(); track item.path) {
          <a [routerLink]="item.path" routerLinkActive="!bg-nav-active !text-nav-text [&_hg-icon]:!text-nav-accent"
             class="flex h-11 items-center gap-3 rounded-[10px] px-3 font-medium text-nav-muted transition-colors hover:text-nav-text">
            <hg-icon [name]="item.icon" />{{ t(item.label) }}
          </a>
        }
        <div class="mt-auto flex items-center gap-3 rounded-xl bg-nav-active p-3 text-nav-text">
          <span class="grid size-9 place-items-center rounded-full bg-nav text-xs font-semibold text-nav-accent">{{ auth.initials() }}</span>
          <span class="min-w-0 flex-1">
            <b class="block truncate font-medium">{{ auth.fullName() }}</b>
            <small class="block truncate text-[11px] text-nav-muted">{{ auth.isAdmin() ? t('admin.administrator') : auth.user()?.email }}</small>
          </span>
          <button type="button" class="text-nav-muted hover:text-nav-text" [attr.aria-label]="t('nav.logout')" (click)="auth.logout()"><hg-icon name="logout" [size]="16" /></button>
        </div>
      </aside>

      <main class="min-w-0 flex-1 p-4 pb-28 lg:p-8">
        <div class="mx-auto flex max-w-[1180px] flex-col gap-6"><router-outlet /></div>
      </main>

      <nav class="fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-center justify-around border-t border-line bg-nav px-2 lg:hidden">
        @for (item of nav(); track item.path) {
          <a [routerLink]="item.path" routerLinkActive="!text-nav-accent"
             class="flex min-h-14 min-w-16 flex-col items-center justify-center gap-0.5 text-[11px] text-nav-muted">
            <hg-icon [name]="item.icon" />{{ t(item.label) }}
          </a>
        }
      </nav>
    </div>
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly t = inject(I18n).t;
  private readonly userNav: NavItem[] = [
    { path: '/dashboard', icon: 'dashboard', label: 'nav.dashboard' },
    { path: '/transactions', icon: 'swap', label: 'nav.transactions' },
    { path: '/accounts', icon: 'wallet', label: 'nav.accounts' },
    { path: '/categories', icon: 'tag', label: 'nav.categories' },
    { path: '/settings', icon: 'sliders', label: 'nav.settings' },
  ];
  private readonly adminNav: NavItem[] = [
    { path: '/admin/users', icon: 'users', label: 'nav.users' },
    { path: '/settings', icon: 'sliders', label: 'nav.settings' },
  ];
  protected readonly nav = computed(() => (this.auth.isAdmin() ? this.adminNav : this.userNav));
}
