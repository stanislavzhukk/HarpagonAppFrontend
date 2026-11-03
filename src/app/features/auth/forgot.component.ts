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
  selector: 'hg-forgot',
  imports: [ReactiveFormsModule, RouterLink, ErrorBannerComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="flex flex-col gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <a routerLink="/login" class="flex items-center gap-1.5 text-[13px] font-medium text-ink-2"><hg-icon name="chevL" [size]="14" />{{ t('common.backToLogin') }}</a>
      <div class="flex flex-col gap-2"><h2 class="h1">{{ t('forgot.title') }}</h2><p class="text-ink-2">{{ t('forgot.lead') }}</p></div>
      <hg-error-banner [error]="error()" />
      @if (sent()) {
        <div class="alert alert-success"><hg-icon name="check" [size]="20" /><div class="text-[13px]"><b class="font-semibold">{{ t('forgot.sent') }}</b></div></div>
      }
      <div class="flex flex-col gap-1.5">
        <label class="label" for="email">{{ t('field.email') }}</label>
        <div class="input" [class.invalid]="fieldError(form.controls.email)"><hg-icon name="mail" [size]="16" class="text-ink-3" /><input id="email" type="email" formControlName="email" autocomplete="email" /></div>
        @if (fieldError(form.controls.email); as msg) { <span class="hint hint-error">{{ msg }}</span> }
      </div>
      <button type="submit" class="btn btn-primary btn-block !h-[46px]" [disabled]="busy()">{{ busy() ? t('common.loading') : t('forgot.submit') }}</button>
    </form>
  `,
})
export class ForgotComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly t = inject(I18n).t;
  protected readonly busy = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  protected readonly fieldError = (c: Parameters<typeof fieldError>[0]) => fieldError(c, this.t);

  constructor() {
    const q = inject(ActivatedRoute).snapshot.queryParamMap;
    if (q.has('userId') && q.has('token')) {
      void this.router.navigate(['/reset-password'], { queryParams: { userId: q.get('userId'), token: q.get('token') }, replaceUrl: true });
    }
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    this.sent.set(false);
    this.auth.forgotPassword(this.form.getRawValue().email.trim()).subscribe({
      next: () => {
        this.sent.set(true);
        this.busy.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e);
        this.busy.set(false);
      },
    });
  }
}
