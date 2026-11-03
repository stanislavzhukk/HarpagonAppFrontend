import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../core/api/api-error';
import { I18n } from '../../core/i18n/i18n.service';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { amountValidator, fieldError, parseAmount } from '../../shared/util/forms';
import { AccountsService } from './accounts.service';

@Component({
  selector: 'hg-account-create-form',
  imports: [ReactiveFormsModule, ErrorBannerComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <hg-error-banner [error]="error()" />
      <div class="flex flex-col gap-1.5">
        <label class="label" for="acc-name">{{ t('acc.name') }}</label>
        <div class="input" [class.invalid]="fe(form.controls.accountName)"><input id="acc-name" formControlName="accountName" [placeholder]="t('acc.namePh')" /></div>
        @if (fe(form.controls.accountName); as m) { <span class="hint hint-error"><hg-icon name="alert" [size]="14" />{{ m }}</span> }
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label class="label" for="acc-bal">{{ t('acc.initialBalance') }}</label>
          <div class="input" [class.invalid]="fe(form.controls.initialBalance)"><input id="acc-bal" formControlName="initialBalance" inputmode="decimal" /><span class="text-ink-3">zł</span></div>
          @if (fe(form.controls.initialBalance); as m) { <span class="hint hint-error">{{ m }}</span> }
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="label" for="acc-goal">{{ t('acc.goal') }}</label>
          <div class="input" [class.invalid]="fe(form.controls.initialGoal)"><input id="acc-goal" formControlName="initialGoal" inputmode="decimal" /><span class="text-ink-3">zł</span></div>
          @if (fe(form.controls.initialGoal); as m) { <span class="hint hint-error">{{ m }}</span> }
        </div>
      </div>
      <p class="hint">{{ t('acc.goalHint') }}</p>
      <div class="flex justify-end gap-3">
        @if (cancellable()) { <button type="button" class="btn btn-secondary" (click)="cancelled.emit()">{{ t('common.cancel') }}</button> }
        <button type="submit" class="btn btn-primary" [class.btn-block]="!cancellable()" [disabled]="busy()">{{ busy() ? t('common.loading') : t('acc.create') }}</button>
      </div>
    </form>
  `,
})
export class AccountCreateFormComponent {
  readonly cancellable = input(true);
  readonly created = output<void>();
  readonly cancelled = output<void>();

  private readonly t_ = inject(I18n);
  protected readonly t = this.t_.t;
  private readonly api = inject(AccountsService);
  private readonly fb = inject(FormBuilder);
  protected readonly busy = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    accountName: ['', [Validators.required, Validators.maxLength(100)]],
    initialBalance: ['0', [Validators.required, amountValidator({ min: 0 })]],
    initialGoal: ['0', [Validators.required, amountValidator({ min: 0 })]],
  });
  protected readonly fe = (c: Parameters<typeof fieldError>[0]) => fieldError(c, this.t);

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.error.set(null);
    this.api.create({ accountName: v.accountName.trim(), initialBalance: parseAmount(v.initialBalance), initialGoal: parseAmount(v.initialGoal) }).subscribe({
      next: () => this.created.emit(),
      error: (e: ApiError) => {
        this.error.set(e);
        this.busy.set(false);
      },
    });
  }
}
