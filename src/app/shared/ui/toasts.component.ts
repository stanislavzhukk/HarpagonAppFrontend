import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../../core/i18n/i18n.service';
import { ToastService } from '../../core/toast/toast.service';
import { IconComponent, IconName } from './icon.component';

@Component({
  selector: 'hg-toasts',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="card pointer-events-auto flex items-start gap-3 p-4 shadow-pop" [attr.role]="toast.kind === 'error' ? 'alert' : 'status'">
          <span class="ico-ch" [style.background]="bg(toast.kind)" [style.color]="fg(toast.kind)"><hg-icon [name]="icon(toast.kind)" [size]="16" /></span>
          <div class="min-w-0 flex-1">
            <b class="font-semibold">{{ toast.title }}</b>
            @if (toast.items.length) {
              <ul class="mt-1 space-y-0.5 text-[13px] leading-5 text-ink-2">
                @for (item of toast.items; track $index) { <li>• {{ item }}</li> }
              </ul>
            }
          </div>
          <button type="button" class="text-ink-3 hover:text-ink" [attr.aria-label]="t('common.close')" (click)="toasts.dismiss(toast.id)"><hg-icon name="x" [size]="16" /></button>
        </div>
      }
    </div>
  `,
})
export class ToastsComponent {
  protected readonly toasts = inject(ToastService);
  protected readonly t = inject(I18n).t;

  protected icon(kind: string): IconName {
    return kind === 'success' ? 'check' : kind === 'warning' ? 'warn' : kind === 'info' ? 'info' : 'alert';
  }
  protected bg(kind: string): string {
    return `var(--${kind === 'success' ? 'income' : kind === 'warning' ? 'warning' : kind === 'info' ? 'info' : 'danger'}-bg)`;
  }
  protected fg(kind: string): string {
    return `var(--${kind === 'success' ? 'income' : kind === 'warning' ? 'warning' : kind === 'info' ? 'info' : 'danger'})`;
  }
}
