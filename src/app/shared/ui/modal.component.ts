import { ChangeDetectionStrategy, Component, HostListener, inject, input, output } from '@angular/core';
import { I18n } from '../../core/i18n/i18n.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'hg-modal',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 grid place-items-center bg-[rgb(36_26_20/.5)] p-4" (click)="closed.emit()">
      <div class="card flex w-[min(520px,100%)] flex-col gap-5 p-6 shadow-pop sm:p-8" role="dialog" aria-modal="true" [attr.aria-label]="heading()" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between">
          <h2 class="h1 !text-[26px] !leading-8">{{ heading() }}</h2>
          <button type="button" class="btn btn-secondary btn-icon" [attr.aria-label]="t('common.close')" (click)="closed.emit()"><hg-icon name="x" /></button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly heading = input.required<string>();
  readonly closed = output<void>();
  protected readonly t = inject(I18n).t;

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closed.emit();
  }
}
