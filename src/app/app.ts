import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';
import { ToastsComponent } from './shared/ui/toasts.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet /><hg-toasts />`,
})
export class App {
  private readonly theme = inject(ThemeService);
}
