import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'hg-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-2.5">
      <span class="grid size-[34px] place-items-center rounded-[10px]" [class]="onDark() ? 'bg-nav-active' : 'bg-action'">
        <span class="grid size-5 place-items-center rounded-full bg-brass">
          <span class="size-3 rounded-full border-[1.6px] border-nav-active"></span>
        </span>
      </span>
      <b class="font-display text-[22px] leading-7 font-semibold tracking-[-0.03em]" [class]="onDark() ? 'text-nav-text' : 'text-ink'">Harpagon</b>
    </span>
  `,
})
export class LogoComponent {
  readonly onDark = input(false);
}
