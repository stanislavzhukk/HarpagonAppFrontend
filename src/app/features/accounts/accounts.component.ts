import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ApiError } from '../../core/api/api-error';
import { Account } from '../../core/api/models';
import { I18n } from '../../core/i18n/i18n.service';
import { ToastService } from '../../core/toast/toast.service';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { parseAmount } from '../../shared/util/forms';
import { AccountCreateFormComponent } from './account-create-form.component';
import { AccountsService } from './accounts.service';

type Edit = { account: Account; field: 'balance' | 'goal' };

@Component({
  selector: 'hg-accounts',
  imports: [PageHeaderComponent, IconComponent, ModalComponent, AccountCreateFormComponent, ErrorBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hg-page-header [title]="t('nav.accounts')" [subtitle]="t('acc.subtitle')">
      <button type="button" class="btn btn-primary" (click)="creating.set(true)"><hg-icon name="plus" [size]="16" />{{ t('acc.new') }}</button>
    </hg-page-header>

    <section class="card flex flex-wrap items-center justify-between gap-4 p-6">
      <div><div class="over">{{ t('dash.balance') }}</div><div class="fig-l">{{ i18n.money(total()) }}</div></div>
      <div class="text-ink-2">{{ t('dash.accounts', { n: accounts().length }) }}</div>
    </section>

    <hg-error-banner [error]="error()" />

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      @for (a of accounts(); track a.id) {
        <article class="card flex flex-col gap-4 p-6">
          <div class="flex items-center justify-between"><h3 class="h3">{{ a.name }}</h3>
            <button type="button" class="p-1 text-ink-3 hover:text-danger" [attr.aria-label]="t('common.delete')" (click)="deleting.set(a)"><hg-icon name="trash" [size]="16" /></button></div>
          <div class="flex items-end justify-between gap-2">
            <div><div class="over">{{ t('acc.balance') }}</div><div class="fig-l">{{ i18n.money(a.balance) }}</div></div>
            <button type="button" class="btn btn-secondary btn-sm" (click)="startEdit(a, 'balance')"><hg-icon name="edit" [size]="14" />{{ t('common.edit') }}</button>
          </div>
          <div class="flex flex-col gap-2 border-t border-line pt-4">
            <div class="flex items-center justify-between text-[13px]">
              <span class="text-ink-2">@if (a.goal > 0) { {{ t('acc.goalOf', { v: i18n.money(a.goal) }) }} } @else { {{ t('acc.noGoal') }} }</span>
              <button type="button" class="font-medium text-info" (click)="startEdit(a, 'goal')">{{ t('acc.setGoal') }}</button>
            </div>
            @if (a.goal > 0) {
              <div class="bar"><i [style.width.%]="pct(a)"></i></div>
              <span class="text-xs text-ink-3">{{ t('acc.goalPct', { n: pct(a) }) }}</span>
            }
          </div>
        </article>
      } @empty {
        @if (!loading()) { <div class="card col-span-full p-10 text-center text-ink-3"><b class="block text-ink">{{ t('acc.empty') }}</b></div> }
      }
    </div>

    @if (creating()) {
      <hg-modal [heading]="t('acc.new')" (closed)="creating.set(false)">
        <hg-account-create-form (cancelled)="creating.set(false)" (created)="onCreated()" />
      </hg-modal>
    }

    @if (edit(); as e) {
      <hg-modal [heading]="e.field === 'balance' ? t('acc.editBalance') : t('acc.setGoal')" (closed)="edit.set(null)">
        <form class="flex flex-col gap-4" (submit)="$event.preventDefault(); saveEdit()">
          <hg-error-banner [error]="editError()" />
          <p class="text-ink-2">{{ e.account.name }}</p>
          <div class="flex flex-col gap-1.5">
            <label class="label" for="edit-v">{{ e.field === 'balance' ? t('acc.balance') : t('acc.goal') }}</label>
            <div class="input" [class.invalid]="editInvalid()"><input id="edit-v" [value]="editValue()" (input)="editValue.set($any($event.target).value)" inputmode="decimal" /><span class="text-ink-3">zł</span></div>
            @if (editInvalid()) { <span class="hint hint-error">{{ t('validation.amount') }}</span> }
          </div>
          <div class="flex justify-end gap-3"><button type="button" class="btn btn-secondary" (click)="edit.set(null)">{{ t('common.cancel') }}</button><button type="submit" class="btn btn-primary" [disabled]="busy()">{{ t('common.save') }}</button></div>
        </form>
      </hg-modal>
    }

    @if (deleting(); as d) {
      <hg-modal [heading]="t('acc.deleteQ', { name: d.name })" (closed)="deleting.set(null)">
        <p class="text-ink-2">{{ t('acc.deleteHint') }}</p>
        <hg-error-banner [error]="editError()" />
        <div class="flex justify-end gap-3"><button type="button" class="btn btn-secondary" (click)="deleting.set(null)">{{ t('common.cancel') }}</button><button type="button" class="btn btn-danger" [disabled]="busy()" (click)="confirmDelete()">{{ t('common.delete') }}</button></div>
      </hg-modal>
    }
  `,
})
export class AccountsComponent {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly api = inject(AccountsService);
  private readonly toasts = inject(ToastService);

  protected readonly accounts = signal<Account[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly creating = signal(false);
  protected readonly edit = signal<Edit | null>(null);
  protected readonly editValue = signal('');
  protected readonly editInvalid = signal(false);
  protected readonly editError = signal<ApiError | null>(null);
  protected readonly deleting = signal<Account | null>(null);
  protected readonly busy = signal(false);
  protected readonly total = computed(() => this.accounts().reduce((s, a) => s + a.balance, 0));

  constructor() {
    this.load();
  }

  private load(): void {
    this.api.list().subscribe({
      next: (a) => { this.accounts.set(a); this.loading.set(false); },
      error: (e: ApiError) => { this.error.set(e); this.loading.set(false); },
    });
  }

  protected pct(a: Account): number {
    return a.goal > 0 ? Math.max(0, Math.min(100, Math.round((a.balance / a.goal) * 100))) : 0;
  }

  protected startEdit(account: Account, field: 'balance' | 'goal'): void {
    this.edit.set({ account, field });
    this.editValue.set(String(field === 'balance' ? account.balance : account.goal).replace('.', ','));
    this.editInvalid.set(false);
    this.editError.set(null);
  }

  protected saveEdit(): void {
    const e = this.edit();
    if (!e) return;
    const n = parseAmount(this.editValue());
    if (Number.isNaN(n) || n < 0) { this.editInvalid.set(true); return; }
    this.busy.set(true);
    this.editError.set(null);
    const call = e.field === 'balance' ? this.api.setBalance(e.account.id, n) : this.api.setGoal(e.account.id, n);
    call.subscribe({
      next: () => { this.busy.set(false); this.edit.set(null); this.toasts.success(this.t('acc.updated')); this.load(); },
      error: (err: ApiError) => { this.busy.set(false); this.editError.set(err); },
    });
  }

  protected confirmDelete(): void {
    const d = this.deleting();
    if (!d) return;
    this.busy.set(true);
    this.editError.set(null);
    this.api.remove(d.id).subscribe({
      next: () => { this.busy.set(false); this.deleting.set(null); this.toasts.success(this.t('acc.deleted')); this.load(); },
      error: (err: ApiError) => { this.busy.set(false); this.editError.set(err); },
    });
  }

  protected onCreated(): void {
    this.creating.set(false);
    this.toasts.success(this.t('acc.created'));
    this.load();
  }
}
