import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ApiError } from '../../core/api/api-error';
import { I18n } from '../../core/i18n/i18n.service';
import { describeError } from '../../core/toast/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'hg-error-banner',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <div class="alert alert-error" role="alert">
        <hg-icon name="alert" [size]="20" />
        <div class="min-w-0 flex-1">
          <b class="font-semibold">{{ v.title }}</b>
          @if (v.items.length) {
            <ul class="mt-1 space-y-0.5 text-[13px] leading-5 text-ink-2">
              @for (item of v.items; track $index) { <li>• {{ item }}</li> }
            </ul>
          }
        </div>
      </div>
    }
  `,
})
export class ErrorBannerComponent {
  readonly error = input<ApiError | null>(null);
  private readonly t = inject(I18n).t;
  protected readonly view = computed(() => {
    const e = this.error();
    return e ? describeError(e, this.t) : null;
  });
}
