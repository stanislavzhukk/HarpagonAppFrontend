import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { I18n } from '../../core/i18n/i18n.service';
import { describeError } from '../../core/toast/toast.service';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'hg-confirm-email',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-4 text-center">
      @switch (state()) {
        @case ('working') {
          <span class="ico-ch !size-16 !bg-info-bg !text-info"><hg-icon name="spinner" [size]="28" class="animate-spin" /></span>
          <h2 class="h1">{{ t('confirm.working') }}</h2>
        }
        @case ('done') {
          <span class="ico-ch !size-16 !bg-income-bg !text-income"><hg-icon name="check" [size]="28" /></span>
          <h2 class="h1">{{ t('confirm.doneTitle') }}</h2>
          <p class="text-ink-2">{{ t('confirm.doneLead') }}</p>
          <a routerLink="/login" class="btn btn-primary btn-block">{{ t('confirm.toLogin') }}</a>
        }
        @case ('failed') {
          <span class="ico-ch !size-16 !bg-danger-bg !text-danger"><hg-icon name="alert" [size]="28" /></span>
          <h2 class="h1">{{ t('confirm.failedTitle') }}</h2>
          <p class="text-ink-2">{{ message() }}</p>
          <a routerLink="/login" class="btn btn-secondary btn-block">{{ t('common.backToLogin') }}</a>
        }
      }
    </div>
  `,
})
export class ConfirmEmailComponent {
  private readonly auth = inject(AuthService);
  protected readonly t = inject(I18n).t;
  protected readonly state = signal<'working' | 'done' | 'failed'>('working');
  protected readonly message = signal('');

  constructor() {
    const q = inject(ActivatedRoute).snapshot.queryParamMap;
    const userId = q.get('userId');
    const token = q.get('token');
    if (!userId || !token) {
      this.message.set(this.t('confirm.failedLead'));
      this.state.set('failed');
      return;
    }
    this.auth.confirmEmail(userId, token).subscribe({
      next: () => this.state.set('done'),
      error: (e: ApiError) => {
        const { title } = describeError(e, this.t);
        this.message.set(title);
        this.state.set('failed');
      },
    });
  }
}
