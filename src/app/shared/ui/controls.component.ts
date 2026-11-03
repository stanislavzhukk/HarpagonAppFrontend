import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { I18n } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/theme/theme.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'hg-controls',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3">
      <div class="seg" role="group" [attr.aria-label]="t('settings.language')">
        <button type="button" [class.on]="i18n.lang() === 'en'" (click)="i18n.set('en')">EN</button>
        <button type="button" [class.on]="i18n.lang() === 'pl'" (click)="i18n.set('pl')">PL</button>
      </div>
      <button type="button" class="btn btn-secondary btn-icon" [attr.aria-label]="theme.isDark() ? t('theme.light') : t('theme.dark')" (click)="theme.toggle()">
        <hg-icon [name]="theme.isDark() ? 'sun' : 'moon'" />
      </button>
    </div>
  `,
})
export class ControlsComponent {
  protected readonly i18n = inject(I18n);
  protected readonly theme = inject(ThemeService);
  protected readonly t = this.i18n.t;
  readonly compact = input(false);
}
