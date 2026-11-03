import { ChangeDetectionStrategy, Component, HostListener, inject, input, output } from '@angular/core';
import { I18n } from '../../core/i18n/i18n.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'hg-drawer',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 bg-[rgb(36_26_20/.5)]" (click)="closed.emit()"></div>
    <aside class="fixed inset-y-0 right-0 z-50 flex w-[min(480px,100vw)] flex-col gap-5 overflow-y-auto bg-surface p-6 shadow-pop sm:p-8" role="dialog" aria-modal="true" [attr.aria-label]="heading()">
      <div class="flex items-center justify-between">
        <h2 class="h1 !text-[26px] !leading-8">{{ heading() }}</h2>
        <button type="button" class="btn btn-secondary btn-icon" [attr.aria-label]="t('common.close')" (click)="closed.emit()"><hg-icon name="x" /></button>
      </div>
      <ng-content />
    </aside>
  `,
})
export class DrawerComponent {
  readonly heading = input.required<string>();
  readonly closed = output<void>();
  protected readonly t = inject(I18n).t;

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closed.emit();
  }
}
