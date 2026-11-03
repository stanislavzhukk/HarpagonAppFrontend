import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { I18n } from '../../core/i18n/i18n.service';
import { AuthService } from '../../core/auth/auth.service';
import { ControlsComponent } from '../../shared/ui/controls.component';
import { LogoComponent } from '../../shared/ui/logo.component';
import { AccountCreateFormComponent } from '../accounts/account-create-form.component';

@Component({
  selector: 'hg-setup',
  imports: [AccountCreateFormComponent, ControlsComponent, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="grid min-h-dvh place-items-center bg-page p-4">
      <div class="card flex w-[min(520px,100%)] flex-col gap-6 p-6 sm:p-10">
        <div class="flex items-center justify-between"><hg-logo /><hg-controls /></div>
        <div><h1 class="h1">{{ t('setup.title') }}</h1><p class="mt-2 text-ink-2">{{ t('setup.lead') }}</p></div>
        <hg-account-create-form [cancellable]="false" (created)="done()" />
        <button type="button" class="text-center text-[13px] text-ink-3" (click)="auth.logout()">{{ t('nav.logout') }}</button>
      </div>
    </main>
  `,
})
export class SetupComponent {
  protected readonly t = inject(I18n).t;
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected done(): void {
    void this.router.navigateByUrl('/dashboard');
  }
}
