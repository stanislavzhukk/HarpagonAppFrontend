import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { I18n } from '../../core/i18n/i18n.service';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { PasswordRulesComponent } from '../../shared/ui/password-rules.component';
import { fieldError, passwordValidator } from '../../shared/util/forms';

@Component({
  selector: 'hg-register',
  imports: [ReactiveFormsModule, RouterLink, ErrorBannerComponent, IconComponent, PasswordRulesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="flex flex-col gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="flex flex-col gap-2"><h2 class="h1">{{ t('register.title') }}</h2><p class="text-ink-2">{{ t('register.lead') }}</p></div>
      <hg-error-banner [error]="error()" />

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label class="label" for="name">{{ t('field.firstName') }}</label>
          <div class="input" [class.invalid]="fieldError(form.controls.name)"><input id="name" formControlName="name" autocomplete="given-name" /></div>
          @if (fieldError(form.controls.name); as msg) { <span class="hint hint-error">{{ msg }}</span> }
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="label" for="surname">{{ t('field.lastName') }} <span class="text-ink-3">({{ t('common.optional') }})</span></label>
          <div class="input" [class.invalid]="fieldError(form.controls.surname)"><input id="surname" formControlName="surname" autocomplete="family-name" /></div>
          @if (fieldError(form.controls.surname); as msg) { <span class="hint hint-error">{{ msg }}</span> }
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="label" for="email">{{ t('field.email') }}</label>
        <div class="input" [class.invalid]="fieldError(form.controls.email)"><input id="email" type="email" formControlName="email" autocomplete="email" /></div>
        @if (fieldError(form.controls.email); as msg) { <span class="hint hint-error">{{ msg }}</span> }
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="label" for="password">{{ t('field.password') }}</label>
        <div class="input" [class.invalid]="fieldError(form.controls.password)">
          <input id="password" [type]="show() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" />
          <button type="button" class="text-ink-3" [attr.aria-label]="show() ? t('common.hide') : t('common.show')" (click)="show.set(!show())"><hg-icon [name]="show() ? 'eyeOff' : 'eye'" [size]="16" /></button>
        </div>
        <hg-password-rules [value]="form.controls.password.value" />
      </div>

      <button type="submit" class="btn btn-primary btn-block !h-[46px]" [disabled]="busy()">{{ busy() ? t('common.loading') : t('register.submit') }}</button>
      <p class="text-center text-[13px] text-ink-2">{{ t('register.haveAccount') }} <a routerLink="/login" class="font-semibold text-info">{{ t('register.login') }}</a></p>
    </form>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly t = inject(I18n).t;

  protected readonly busy = signal(false);
  protected readonly show = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    surname: ['', [Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, passwordValidator]],
  });
  protected readonly fieldError = (c: Parameters<typeof fieldError>[0]) => fieldError(c, this.t);

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.auth.register({ email: v.email.trim(), name: v.name.trim(), surname: v.surname.trim() || undefined, password: v.password }).subscribe({
      next: () => void this.router.navigate(['/check-inbox'], { queryParams: { email: v.email.trim() } }),
      error: (e: ApiError) => {
        this.error.set(e);
        this.busy.set(false);
      },
    });
  }
}
