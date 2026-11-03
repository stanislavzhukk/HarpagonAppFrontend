import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { I18n } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/theme/theme.service';
import { ToastService } from '../../core/toast/toast.service';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { PasswordRulesComponent } from '../../shared/ui/password-rules.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { fieldError, matchValidator, passwordValidator } from '../../shared/util/forms';

@Component({
  selector: 'hg-settings',
  imports: [PageHeaderComponent, ReactiveFormsModule, ErrorBannerComponent, PasswordRulesComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hg-page-header [title]="t('nav.settings')" [subtitle]="t('settings.subtitle')" />
    <div class="grid gap-6 lg:grid-cols-2">
      <section class="card flex flex-col gap-4 p-6">
        <h2 class="h3">{{ t('settings.profile') }}</h2>
        <div class="flex items-center gap-4"><span class="grid size-14 place-items-center rounded-full bg-action font-semibold text-on-action">{{ auth.initials() }}</span>
          <div><div class="font-semibold">{{ auth.fullName() }}</div><div class="text-ink-2">{{ auth.user()?.email }}</div></div></div>
        <p class="hint">{{ t('settings.profileHint') }}</p>
      </section>

      <section class="card flex flex-col gap-5 p-6">
        <h2 class="h3">{{ t('settings.appearance') }}</h2>
        <div class="flex flex-col gap-1.5"><span class="label">{{ t('settings.language') }}</span>
          <div class="seg w-fit"><button type="button" [class.on]="i18n.lang() === 'en'" (click)="i18n.set('en')">English</button><button type="button" [class.on]="i18n.lang() === 'pl'" (click)="i18n.set('pl')">Polski</button></div></div>
        <div class="flex flex-col gap-1.5"><span class="label">{{ t('settings.theme') }}</span>
          <div class="seg w-fit">
            @for (m of modes; track m) { <button type="button" [class.on]="theme.mode() === m" (click)="theme.set(m)">{{ t(modeKey(m)) }}</button> }
          </div></div>
      </section>

      <section class="card flex flex-col gap-4 p-6 lg:col-span-2">
        <h2 class="h3">{{ t('settings.password') }}</h2>
        <form class="grid gap-6 md:grid-cols-2" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="flex flex-col gap-4">
            <hg-error-banner [error]="error()" />
            @for (f of fields; track f.name) {
              <div class="flex flex-col gap-1.5">
                <label class="label" [for]="'pw-' + f.name">{{ t(f.label) }}</label>
                <div class="input" [class.invalid]="fe(form.controls[f.name])"><input [id]="'pw-' + f.name" type="password" [formControlName]="f.name" [autocomplete]="f.name === 'previousPassword' ? 'current-password' : 'new-password'" /></div>
                @if (fe(form.controls[f.name]); as m) { <span class="hint hint-error"><hg-icon name="alert" [size]="14" />{{ m }}</span> }
              </div>
            }
            <div><button type="submit" class="btn btn-primary" [disabled]="busy()">{{ busy() ? t('common.loading') : t('settings.changePassword') }}</button></div>
          </div>
          <hg-password-rules [value]="form.controls.newPassword.value" />
        </form>
      </section>

      <section class="card flex items-center justify-between gap-4 p-6 lg:col-span-2">
        <div><h2 class="h3">{{ t('nav.logout') }}</h2><p class="text-ink-2">{{ t('settings.logoutHint') }}</p></div>
        <button type="button" class="btn btn-danger-outline" (click)="auth.logout()"><hg-icon name="logout" [size]="16" />{{ t('nav.logout') }}</button>
      </section>
    </div>
  `,
})
export class SettingsComponent {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly modes = ['light', 'dark', 'system'] as const;
  protected modeKey(m: (typeof this.modes)[number]) {
    return m === 'light' ? 'theme.light' : m === 'dark' ? 'theme.dark' : 'theme.system';
  }
  protected readonly fields = [
    { name: 'previousPassword', label: 'settings.currentPassword' },
    { name: 'newPassword', label: 'field.newPassword' },
    { name: 'confirmPassword', label: 'field.repeatPassword' },
  ] as const;

  protected readonly busy = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    previousPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, passwordValidator]],
    confirmPassword: ['', [Validators.required, matchValidator('newPassword')]],
  });
  protected readonly fe = (c: Parameters<typeof fieldError>[0]) => fieldError(c, this.t);

  constructor() {
    this.form.controls.newPassword.valueChanges.subscribe(() => this.form.controls.confirmPassword.updateValueAndValidity());
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    this.auth.changePassword(this.form.getRawValue()).subscribe({
      next: () => { this.busy.set(false); this.form.reset(); this.toasts.success(this.t('settings.passwordChanged')); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e); },
    });
  }
}
