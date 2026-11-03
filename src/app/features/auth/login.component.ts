import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { I18n } from '../../core/i18n/i18n.service';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { fieldError } from '../../shared/util/forms';

@Component({
  selector: 'hg-login',
  imports: [ReactiveFormsModule, RouterLink, ErrorBannerComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="flex flex-col gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="flex flex-col gap-2"><h2 class="h1">{{ t('login.title') }}</h2><p class="text-ink-2">{{ t('login.lead') }}</p></div>

      @if (expired) {
        <div class="alert alert-warning"><hg-icon name="lock" [size]="20" /><div class="text-[13px]">{{ t('error.sessionExpired') }}</div></div>
      }
      <hg-error-banner [error]="error()" />

      <div class="flex flex-col gap-1.5">
        <label class="label" for="email">{{ t('field.email') }}</label>
        <div class="input" [class.invalid]="fieldError(form.controls.email)">
          <hg-icon name="mail" [size]="16" class="text-ink-3" />
          <input id="email" type="email" formControlName="email" autocomplete="email" />
        </div>
        @if (fieldError(form.controls.email); as msg) { <span class="hint hint-error"><hg-icon name="alert" [size]="14" />{{ msg }}</span> }
      </div>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <label class="label" for="password">{{ t('field.password') }}</label>
          <a routerLink="/forgot-password" class="text-xs font-medium text-info">{{ t('login.forgot') }}</a>
        </div>
        <div class="input" [class.invalid]="fieldError(form.controls.password)">
          <hg-icon name="lock" [size]="16" class="text-ink-3" />
          <input id="password" [type]="show() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
          <button type="button" class="text-ink-3" [attr.aria-label]="show() ? t('common.hide') : t('common.show')" (click)="show.set(!show())"><hg-icon [name]="show() ? 'eyeOff' : 'eye'" [size]="16" /></button>
        </div>
        @if (fieldError(form.controls.password); as msg) { <span class="hint hint-error"><hg-icon name="alert" [size]="14" />{{ msg }}</span> }
      </div>

      <button type="submit" class="btn btn-primary btn-block !h-[46px]" [disabled]="busy()">{{ busy() ? t('common.loading') : t('login.submit') }}</button>
      <p class="text-center text-[13px] text-ink-2">{{ t('login.noAccount') }} <a routerLink="/register" class="font-semibold text-info">{{ t('login.register') }}</a></p>
    </form>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly t = inject(I18n).t;

  protected readonly expired = this.route.snapshot.queryParamMap.has('expired');
  protected readonly busy = signal(false);
  protected readonly show = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  protected readonly fieldError = (c: Parameters<typeof fieldError>[0]) => fieldError(c, this.t);

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/');
      },
      error: (e: ApiError) => {
        this.error.set(e);
        this.busy.set(false);
      },
    });
  }
}
