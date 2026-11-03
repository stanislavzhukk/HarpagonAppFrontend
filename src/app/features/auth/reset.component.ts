import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { I18n } from '../../core/i18n/i18n.service';
import { ToastService } from '../../core/toast/toast.service';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { PasswordRulesComponent } from '../../shared/ui/password-rules.component';
import { fieldError, matchValidator, passwordValidator } from '../../shared/util/forms';

@Component({
  selector: 'hg-reset',
  imports: [ReactiveFormsModule, RouterLink, ErrorBannerComponent, IconComponent, PasswordRulesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!userId || !token) {
      <div class="flex flex-col items-center gap-4 text-center">
        <span class="ico-ch !size-16 !bg-danger-bg !text-danger"><hg-icon name="alert" [size]="28" /></span>
        <h2 class="h1">{{ t('reset.invalidTitle') }}</h2>
        <p class="text-ink-2">{{ t('reset.invalidLead') }}</p>
        <a routerLink="/forgot-password" class="btn btn-primary">{{ t('reset.requestNew') }}</a>
      </div>
    } @else {
      <form class="flex flex-col gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="flex flex-col gap-2"><h2 class="h1">{{ t('reset.title') }}</h2><p class="text-ink-2">{{ t('reset.lead') }}</p></div>
        <hg-error-banner [error]="error()" />
        @if (error()) { <a routerLink="/forgot-password" class="text-[13px] font-semibold text-info">{{ t('reset.requestNew') }}</a> }
        <div class="flex flex-col gap-1.5">
          <label class="label" for="password">{{ t('field.newPassword') }}</label>
          <div class="input" [class.invalid]="fieldError(form.controls.password)">
            <input id="password" [type]="show() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" />
            <button type="button" class="text-ink-3" [attr.aria-label]="show() ? t('common.hide') : t('common.show')" (click)="show.set(!show())"><hg-icon [name]="show() ? 'eyeOff' : 'eye'" [size]="16" /></button>
          </div>
          <hg-password-rules [value]="form.controls.password.value" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="label" for="repeat">{{ t('field.repeatPassword') }}</label>
          <div class="input" [class.invalid]="fieldError(form.controls.repeat)"><input id="repeat" [type]="show() ? 'text' : 'password'" formControlName="repeat" autocomplete="new-password" /></div>
          @if (fieldError(form.controls.repeat); as msg) { <span class="hint hint-error">{{ msg }}</span> }
        </div>
        <button type="submit" class="btn btn-primary btn-block !h-[46px]" [disabled]="busy()">{{ busy() ? t('common.loading') : t('reset.submit') }}</button>
      </form>
    }
  `,
})
export class ResetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  protected readonly t = inject(I18n).t;
  private readonly q = inject(ActivatedRoute).snapshot.queryParamMap;
  protected readonly userId = this.q.get('userId');
  protected readonly token = this.q.get('token');

  protected readonly busy = signal(false);
  protected readonly show = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, passwordValidator]],
    repeat: ['', [Validators.required, matchValidator('password')]],
  });
  protected readonly fieldError = (c: Parameters<typeof fieldError>[0]) => fieldError(c, this.t);

  constructor() {
    this.form.controls.password.valueChanges.subscribe(() => this.form.controls.repeat.updateValueAndValidity());
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.userId || !this.token) return;
    this.busy.set(true);
    this.error.set(null);
    this.auth.resetPassword({ userId: this.userId, token: this.token, password: this.form.getRawValue().password }).subscribe({
      next: () => {
        this.toasts.success(this.t('reset.done'));
        void this.router.navigate(['/login']);
      },
      error: (e: ApiError) => {
        this.error.set(e);
        this.busy.set(false);
      },
    });
  }
}
