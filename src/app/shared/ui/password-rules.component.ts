import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18n } from '../../core/i18n/i18n.service';
import { IconComponent } from './icon.component';
import { passwordChecks } from '../util/forms';

@Component({
  selector: 'hg-password-rules',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-1 flex gap-1" aria-hidden="true">
      @for (i of [1, 2, 3, 4]; track i) {
        <span class="bar !h-1 flex-1"><i [style.width.%]="score() >= i ? 100 : 0" [style.background]="color()"></i></span>
      }
    </div>
    <ul class="mt-1.5 space-y-1.5 text-[13px] leading-5">
      @for (r of rules(); track r.key) {
        <li class="flex items-center gap-2" [class]="r.ok ? 'text-income' : 'text-ink-3'">
          <hg-icon [name]="r.ok ? 'check' : 'circle'" [size]="14" />{{ t(r.key) }}
        </li>
      }
    </ul>
  `,
})
export class PasswordRulesComponent {
  readonly value = input('');
  protected readonly t = inject(I18n).t;
  protected readonly rules = computed(() => passwordChecks(this.value()));
  protected readonly score = computed(() => {
    const ok = this.rules().filter((r) => r.ok).length;
    return ok <= 1 ? (this.value() ? 1 : 0) : ok <= 3 ? 2 : ok === 4 ? 3 : 4;
  });
  protected readonly color = computed(() => (this.score() >= 4 ? 'var(--income)' : this.score() >= 2 ? 'var(--warning)' : 'var(--danger)'));
}
