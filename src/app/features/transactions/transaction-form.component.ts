import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../core/api/api-error';
import { Account, Category, CategoryType, Transaction } from '../../core/api/models';
import { I18n } from '../../core/i18n/i18n.service';
import { ToastService } from '../../core/toast/toast.service';
import { DrawerComponent } from '../../shared/ui/drawer.component';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { amountValidator, fieldError, parseAmount } from '../../shared/util/forms';
import { TransactionsService } from './transactions.service';

@Component({
  selector: 'hg-transaction-form',
  imports: [DrawerComponent, ReactiveFormsModule, ErrorBannerComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hg-drawer [heading]="editing() ? t('tx.edit') : t('tx.new')" (closed)="closed.emit()">
      <form class="flex flex-1 flex-col gap-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (editing()) {
          <div class="alert alert-info"><hg-icon name="info" [size]="20" /><div class="text-[13px]">{{ t('tx.editHint') }}</div></div>
        }
        <hg-error-banner [error]="error()" />

        @if (!editing()) {
          <div class="seg w-full" role="group">
            <button type="button" class="flex-1" [class.on]="type() === 'Expense'" [style.background]="type() === 'Expense' ? 'var(--expense-bg)' : null" [style.color]="type() === 'Expense' ? 'var(--expense)' : null" (click)="setType('Expense')">{{ t('tx.expense') }}</button>
            <button type="button" class="flex-1" [class.on]="type() === 'Income'" [style.background]="type() === 'Income' ? 'var(--income-bg)' : null" [style.color]="type() === 'Income' ? 'var(--income)' : null" (click)="setType('Income')">{{ t('tx.income') }}</button>
          </div>
        }

        <div class="flex flex-col gap-1.5">
          <label class="label" for="amount">{{ t('field.amount') }}</label>
          <div class="flex items-center gap-2 rounded-[14px] border-2 bg-surface px-[18px] py-4" [class]="amountError() || error() ? 'border-danger' : 'border-focus'">
            <input id="amount" formControlName="amount" inputmode="decimal" placeholder="0,00" autocomplete="off"
              class="font-display min-w-0 flex-1 border-0 bg-transparent p-0 text-[44px] leading-[48px] font-semibold tracking-[-0.04em] text-ink outline-none" />
            <span class="h2 text-ink-2">zł</span>
          </div>
          @if (amountError(); as msg) { <span class="hint hint-error"><hg-icon name="alert" [size]="14" />{{ msg }}</span> }
        </div>

        @if (editing()) {
          <div class="flex flex-col gap-1.5"><span class="label">{{ t('field.account') }}</span><div class="input disabled"><span class="flex-1">{{ tx()!.account?.name }}</span><hg-icon name="lock" [size]="14" /></div></div>
          <div class="flex flex-col gap-1.5"><span class="label">{{ t('field.category') }}</span><div class="input disabled"><span class="flex-1">{{ tx()!.category?.name }}</span><hg-icon name="lock" [size]="14" /></div></div>
          <div class="flex flex-col gap-1.5"><span class="label">{{ t('field.description') }}</span><div class="input disabled"><span class="flex-1">{{ tx()!.description || '—' }}</span><hg-icon name="lock" [size]="14" /></div></div>
          <div class="flex flex-col gap-1.5"><span class="label">{{ t('field.date') }}</span><div class="input disabled"><span class="flex-1">{{ i18n.dateTime(tx()!.date) }}</span></div></div>
        } @else {
          <div class="flex flex-col gap-1.5">
            <label class="label" for="account">{{ t('field.account') }}</label>
            <div class="input" [class.invalid]="fieldError(form.controls.accountId)">
              <select id="account" formControlName="accountId">
                <option value="" disabled>{{ t('common.choose') }}</option>
                @for (a of accounts(); track a.id) { <option [value]="a.id">{{ a.name }} — {{ i18n.money(a.balance) }}</option> }
              </select><hg-icon name="chevD" [size]="14" class="text-ink-3" />
            </div>
            @if (fieldError(form.controls.accountId); as msg) { <span class="hint hint-error">{{ msg }}</span> }
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="label" for="category">{{ t('field.category') }}</label>
            <div class="input" [class.invalid]="fieldError(form.controls.categoryId)">
              <select id="category" formControlName="categoryId">
                <option value="" disabled>{{ t('common.choose') }}</option>
                @for (c of typedCategories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              </select><hg-icon name="chevD" [size]="14" class="text-ink-3" />
            </div>
            @if (fieldError(form.controls.categoryId); as msg) { <span class="hint hint-error">{{ msg }}</span> }
            <span class="hint">{{ type() === 'Expense' ? t('tx.onlyExpenseCats') : t('tx.onlyIncomeCats') }}</span>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="label" for="desc">{{ t('field.description') }}</label>
            <div class="input" [class.invalid]="fieldError(form.controls.description)"><input id="desc" formControlName="description" /></div>
            @if (fieldError(form.controls.description); as msg) { <span class="hint hint-error">{{ msg }}</span> }
            <span class="hint">{{ form.controls.description.value.length }} / 100 · {{ t('tx.dateAuto') }}</span>
          </div>
        }

        <div class="mt-auto flex flex-col gap-3 pt-2">
          @if (editing() && confirmDelete()) {
            <div class="alert alert-warning"><hg-icon name="warn" [size]="20" /><div class="text-[13px]"><b class="font-semibold">{{ t('tx.deleteQ') }}</b><div class="mt-2 flex gap-2"><button type="button" class="btn btn-danger btn-sm" [disabled]="busy()" (click)="remove()">{{ t('common.delete') }}</button><button type="button" class="btn btn-secondary btn-sm" (click)="confirmDelete.set(false)">{{ t('common.cancel') }}</button></div></div></div>
          }
          <div class="flex items-center justify-between gap-3">
            @if (editing()) { <button type="button" class="btn btn-danger-outline" (click)="confirmDelete.set(true)"><hg-icon name="trash" [size]="16" />{{ t('common.delete') }}</button> } @else { <span></span> }
            <div class="flex gap-3">
              <button type="button" class="btn btn-secondary" (click)="closed.emit()">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary" [disabled]="busy()">{{ busy() ? t('common.loading') : editing() ? t('tx.saveAmount') : type() === 'Expense' ? t('tx.addExpense') : t('tx.addIncome') }}</button>
            </div>
          </div>
        </div>
      </form>
    </hg-drawer>
  `,
})
export class TransactionFormComponent {
  readonly tx = input<Transaction | null>(null);
  readonly accounts = input<Account[]>([]);
  readonly categories = input<Category[]>([]);
  readonly userId = input<string | undefined>(undefined);
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TransactionsService);
  private readonly toasts = inject(ToastService);

  protected readonly editing = computed(() => !!this.tx());
  protected readonly type = signal<CategoryType>('Expense');
  protected readonly typedCategories = computed(() => this.categories().filter((c) => c.type === this.type()));
  protected readonly busy = signal(false);
  protected readonly confirmDelete = signal(false);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    amount: ['', [Validators.required, amountValidator({ positive: true })]],
    accountId: ['', Validators.required],
    categoryId: ['', Validators.required],
    description: ['', [(c: AbstractControl) => (String(c.value ?? '').trim() ? null : { required: true }), Validators.maxLength(100)]],
  });
  protected readonly fieldError = (c: Parameters<typeof fieldError>[0]) => fieldError(c, this.t);
  protected readonly amountError = () => fieldError(this.form.controls.amount, this.t);

  ngOnInit(): void {
    const tx = this.tx();
    if (tx) {
      this.form.controls.amount.setValue(this.i18n.number(tx.amount).replace(/ /g, ' '));
      this.form.controls.accountId.clearValidators();
      this.form.controls.categoryId.clearValidators();
      this.form.controls.description.clearValidators();
      this.form.controls.accountId.updateValueAndValidity();
      this.form.controls.categoryId.updateValueAndValidity();
      this.form.controls.description.updateValueAndValidity();
    } else if (this.accounts().length === 1) {
      this.form.controls.accountId.setValue(this.accounts()[0].id);
    }
  }

  protected setType(t: CategoryType): void {
    this.type.set(t);
    this.form.controls.categoryId.setValue('');
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const amount = parseAmount(this.form.controls.amount.value);
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.error.set(null);
    const tx = this.tx();
    const call = tx
      ? this.api.updateAmount(tx.id, amount, this.userId())
      : this.api.create({ accountId: v.accountId, categoryId: v.categoryId, amount, description: v.description.trim() }, this.userId());
    call.subscribe({
      next: () => {
        this.toasts.success(tx ? this.t('tx.updated') : this.t('tx.added'));
        this.saved.emit();
      },
      error: (e: ApiError) => {
        this.error.set(e);
        this.busy.set(false);
      },
    });
  }

  protected remove(): void {
    const tx = this.tx();
    if (!tx) return;
    this.busy.set(true);
    this.api.remove(tx.id, this.userId()).subscribe({
      next: () => {
        this.toasts.success(this.t('tx.deleted'));
        this.saved.emit();
      },
      error: (e: ApiError) => {
        this.error.set(e);
        this.confirmDelete.set(false);
        this.busy.set(false);
      },
    });
  }
}
