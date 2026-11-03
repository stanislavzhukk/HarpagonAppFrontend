import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18n } from '../core/i18n/i18n.service';
import { ControlsComponent } from '../shared/ui/controls.component';
import { LogoComponent } from '../shared/ui/logo.component';

@Component({
  selector: 'hg-auth-layout',
  imports: [RouterOutlet, ControlsComponent, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen">
      <section class="relative hidden w-[min(640px,45vw)] flex-none flex-col justify-between overflow-hidden border-r border-line bg-nav p-16 text-nav-text lg:flex">
        <span class="absolute -top-[170px] -right-[190px] size-[520px] rounded-full border-[56px] border-brass opacity-90"></span>
        <span class="absolute bottom-[120px] -left-[60px] size-[220px] rounded-full border-4 border-brass opacity-30"></span>
        <hg-logo [onDark]="true" />
        <div class="relative flex flex-col gap-4">
          <h1 class="disp-xl max-w-[520px]">{{ t('brand.tagline') }}</h1>
          <p class="max-w-[420px] text-base leading-6 text-nav-muted">{{ t('brand.lead') }}</p>
        </div>
        <div class="flex gap-8 text-[13px] text-nav-muted"><span>{{ t('brand.f1') }}</span><span>{{ t('brand.f2') }}</span><span>PL / EN</span></div>
      </section>
      <section class="flex min-w-0 flex-1 flex-col px-5 py-6 sm:px-12 sm:py-8">
        <div class="flex items-center justify-between">
          <span class="lg:hidden"><hg-logo /></span>
          <span class="ml-auto"><hg-controls /></span>
        </div>
        <div class="flex flex-1 items-center justify-center py-8"><div class="w-full max-w-[420px]"><router-outlet /></div></div>
      </section>
    </div>
  `,
})
export class AuthLayoutComponent {
  protected readonly t = inject(I18n).t;
}
