import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../../core/i18n/i18n.service';

@Component({
  selector: 'hg-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="grid min-h-dvh place-items-center bg-page p-6 text-center">
      <div class="flex flex-col items-center gap-4">
        <div class="disp-xl text-brass">404</div>
        <h1 class="h1">{{ t('notFound.title') }}</h1>
        <p class="text-ink-2">{{ t('notFound.lead') }}</p>
        <a routerLink="/" class="btn btn-primary">{{ t('notFound.back') }}</a>
      </div>
    </main>
  `,
})
export class NotFoundComponent {
  protected readonly t = inject(I18n).t;
}
