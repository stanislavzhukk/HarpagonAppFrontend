import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18n } from '../../core/i18n/i18n.service';
import { IconComponent } from '../../shared/ui/icon.component';

@Component({
  selector: 'hg-check-inbox',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-5 text-center">
      <span class="ico-ch !size-[72px] !bg-brass-soft !text-ink"><hg-icon name="mail" [size]="32" /></span>
      <h2 class="h1">{{ t('inbox.title') }}</h2>
      <p class="text-ink-2">{{ t('inbox.lead') }} <b class="font-semibold text-ink">{{ email }}</b>. {{ t('inbox.hint') }}</p>
      <a routerLink="/login" class="btn btn-primary btn-block">{{ t('inbox.toLogin') }}</a>
      <p class="text-[13px] text-ink-2">{{ t('inbox.wrong') }} <a routerLink="/register" class="font-semibold text-info">{{ t('inbox.startOver') }}</a></p>
    </div>
  `,
})
export class CheckInboxComponent {
  protected readonly t = inject(I18n).t;
  protected readonly email = inject(ActivatedRoute).snapshot.queryParamMap.get('email') ?? '';
}
