import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ControlsComponent } from './controls.component';

@Component({
  selector: 'hg-page-header',
  imports: [ControlsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="min-w-0">
        <h1 class="h1">{{ title() }}</h1>
        @if (subtitle()) { <p class="mt-1 text-ink-2">{{ subtitle() }}</p> }
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <hg-controls />
        <ng-content />
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
