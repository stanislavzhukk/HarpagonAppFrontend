import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { Account, Category, Transaction, UserData } from '../../core/api/models';
import { I18n } from '../../core/i18n/i18n.service';
import { IconComponent } from '../../shared/ui/icon.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { parseAmount } from '../../shared/util/forms';
import { UsersService } from '../admin/users.service';
import { AccountsService } from '../accounts/accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { TransactionFormComponent } from './transaction-form.component';
import { TransactionsService } from './transactions.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'hg-transactions',
  imports: [PageHeaderComponent, IconComponent, TransactionFormComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (userId) {
      <a routerLink="/admin/users" class="flex items-center gap-1.5 text-[13px] font-medium text-ink-2"><hg-icon name="chevL" [size]="14" />{{ t('nav.users') }}</a>
    }
    <hg-page-header [title]="userId ? (viewedUser()?.name || '') + ' ' + (viewedUser()?.surname || '') : t('nav.transactions')" [subtitle]="userId ? (viewedUser()?.email ?? '') : t('tx.subtitle')">
      @if (!userId) {
        <button type="button" class="btn btn-primary" (click)="openNew()"><hg-icon name="plus" [size]="16" />{{ t('tx.new') }}</button>
      }
    </hg-page-header>

    @if (userId) {
      <div class="alert alert-warning"><hg-icon name="warn" [size]="20" /><div class="text-[13px]"><b class="font-semibold">{{ t('admin.editingOther') }}</b> {{ t('admin.editingOtherHint') }}</div></div>
    }

    <section class="card flex flex-col gap-4 p-5">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex min-w-[240px] flex-1 flex-col gap-1.5">
          <label class="label" for="q">{{ t('filter.search') }}</label>
          <div class="input"><hg-icon name="search" [size]="16" class="text-ink-3" /><input id="q" [value]="search()" (input)="onSearch($any($event.target).value)" [placeholder]="t('filter.searchPh')" /></div>
        </div>
        @if (!userId) {
          <div class="flex w-[200px] flex-col gap-1.5">
            <label class="label" for="cat">{{ t('field.category') }}</label>
            <div class="input"><select id="cat" [value]="category()" (change)="setFilter(category, $any($event.target).value)">
              <option value="">{{ t('filter.allCategories') }}</option>
              @for (c of categories(); track c.id) { <option [value]="c.name">{{ c.name }}</option> }
            </select><hg-icon name="chevD" [size]="14" class="text-ink-3" /></div>
          </div>
        }
        <div class="flex w-[150px] flex-col gap-1.5"><label class="label" for="from">{{ t('filter.from') }}</label><div class="input"><input id="from" type="date" [value]="fromDate()" (change)="setFilter(fromDate, $any($event.target).value)" /></div></div>
        <div class="flex w-[150px] flex-col gap-1.5"><label class="label" for="to">{{ t('filter.to') }}</label><div class="input"><input id="to" type="date" [value]="toDate()" (change)="setFilter(toDate, $any($event.target).value)" /></div></div>
        <div class="flex w-[120px] flex-col gap-1.5"><label class="label" for="min">{{ t('filter.amountMin') }}</label><div class="input"><input id="min" inputmode="decimal" [value]="minAmount()" (change)="setFilter(minAmount, $any($event.target).value)" /></div></div>
        <div class="flex w-[120px] flex-col gap-1.5"><label class="label" for="max">{{ t('filter.amountMax') }}</label><div class="input"><input id="max" inputmode="decimal" [value]="maxAmount()" (change)="setFilter(maxAmount, $any($event.target).value)" placeholder="—" /></div></div>
      </div>
      @if (activeChips().length) {
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-ink-3">{{ t('filter.active') }}</span>
          @for (chip of activeChips(); track chip.label) {
            <span class="chip">{{ chip.label }}<button type="button" class="grid size-5 place-items-center" [attr.aria-label]="t('common.clear')" (click)="chip.clear()"><hg-icon name="x" [size]="12" /></button></span>
          }
          <span class="flex-1"></span>
          <button type="button" class="btn btn-secondary btn-sm" (click)="clearAll()">{{ t('filter.clear') }}</button>
        </div>
      }
    </section>

    <section class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="tbl min-w-[760px]">
          <thead><tr>
            <th><button type="button" class="inline-flex items-center gap-1 uppercase" (click)="toggleSort('date')">{{ t('field.date') }} {{ sortMark('date') }}</button></th>
            <th>{{ t('field.description') }}</th><th>{{ t('field.category') }}</th><th>{{ t('field.account') }}</th>
            <th class="text-right"><button type="button" class="inline-flex items-center gap-1 uppercase" (click)="toggleSort('amount')">{{ t('field.amount') }} {{ sortMark('amount') }}</button></th>
            <th class="w-16"></th>
          </tr></thead>
          <tbody>
            @for (tx of rows(); track tx.id) {
              <tr>
                <td class="num text-ink-2">{{ i18n.date(tx.date) }}</td>
                <td class="font-medium">{{ tx.description || '—' }}</td>
                <td>{{ tx.category?.name }}</td>
                <td class="text-ink-2">{{ tx.account?.name }}</td>
                <td class="text-right"><span class="num" [class]="isIncome(tx) ? 'text-income' : 'text-expense'">{{ isIncome(tx) ? '+' : '−' }}{{ i18n.money(tx.amount) }}</span></td>
                <td class="text-right"><button type="button" class="p-1 text-ink-3 hover:text-ink" [attr.aria-label]="t('common.edit')" (click)="openEdit(tx)"><hg-icon name="edit" [size]="16" /></button></td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="!h-auto py-12 text-center text-ink-3">
                @if (loading()) { {{ t('common.loading') }} } @else if (hasFilters()) { <b class="block text-ink">{{ t('tx.noMatch') }}</b>{{ t('tx.noMatchHint') }} } @else { <b class="block text-ink">{{ t('tx.empty') }}</b>{{ t('tx.emptyHint') }} }
              </td></tr>
            }
          </tbody>
        </table>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
        <span class="text-[13px] text-ink-2">{{ summary() }}</span>
        <div class="flex items-center gap-2">
          <button type="button" class="pg" [disabled]="page() === 0" [attr.aria-label]="t('common.prev')" (click)="page.set(page() - 1)"><hg-icon name="chevL" [size]="14" /></button>
          @for (p of pages(); track p) { <button type="button" class="pg" [class.on]="p === page()" (click)="page.set(p)">{{ p + 1 }}</button> }
          <button type="button" class="pg" [disabled]="page() >= totalPages() - 1" [attr.aria-label]="t('common.next')" (click)="page.set(page() + 1)"><hg-icon name="chevR" [size]="14" /></button>
        </div>
      </div>
    </section>

    @if (formOpen()) {
      <hg-transaction-form [tx]="editing()" [accounts]="accounts()" [categories]="categories()" [userId]="userId ?? undefined" (closed)="closeForm()" (saved)="onSaved()" />
    }
  `,
})
export class TransactionsComponent {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly api = inject(TransactionsService);
  private readonly accountsApi = inject(AccountsService);
  private readonly categoriesApi = inject(CategoriesService);
  private readonly usersApi = inject(UsersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly userId = this.route.snapshot.paramMap.get('userId');
  protected readonly viewedUser = signal<UserData | null>(null);

  protected readonly search = signal('');
  protected readonly category = signal('');
  protected readonly fromDate = signal('');
  protected readonly toDate = signal('');
  protected readonly minAmount = signal('');
  protected readonly maxAmount = signal('');
  protected readonly sort = signal<'date' | 'amount'>('date');
  protected readonly dir = signal<'asc' | 'desc'>('desc');
  protected readonly page = signal(0);
  private readonly reload = signal(0);

  protected readonly rows = signal<Transaction[]>([]);
  protected readonly total = signal(0);
  protected readonly filtered = signal(0);
  protected readonly loading = signal(true);
  protected readonly accounts = signal<Account[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Transaction | null>(null);

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered() / PAGE_SIZE)));
  protected readonly pages = computed(() => {
    const total = this.totalPages();
    const cur = this.page();
    const start = Math.max(0, Math.min(cur - 2, total - 5));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  });
  protected readonly hasFilters = computed(() => this.activeChips().length > 0 || !!this.search());
  protected readonly summary = computed(() => {
    const f = this.filtered();
    if (f === 0) return this.t('tx.showingNone');
    const from = this.page() * PAGE_SIZE + 1;
    const to = Math.min(f, from + PAGE_SIZE - 1);
    return f === this.total() ? this.t('tx.showing', { from, to, total: this.total() }) : this.t('tx.showingFiltered', { from, to, filtered: f, total: this.total() });
  });

  protected readonly activeChips = computed(() => {
    const chips: { label: string; clear: () => void }[] = [];
    if (this.category()) chips.push({ label: `${this.t('field.category')}: ${this.category()}`, clear: () => this.setFilter(this.category, '') });
    if (this.fromDate() || this.toDate()) {
      chips.push({ label: `${this.fromDate() ? this.i18n.date(this.fromDate()) : '…'} – ${this.toDate() ? this.i18n.date(this.toDate()) : '…'}`, clear: () => { this.fromDate.set(''); this.toDate.set(''); this.page.set(0); } });
    }
    if (this.minAmount()) chips.push({ label: `≥ ${this.minAmount()} zł`, clear: () => this.setFilter(this.minAmount, '') });
    if (this.maxAmount()) chips.push({ label: `≤ ${this.maxAmount()} zł`, clear: () => this.setFilter(this.maxAmount, '') });
    return chips;
  });

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const query = computed(() => ({
      start: this.page() * PAGE_SIZE,
      length: PAGE_SIZE,
      search: this.search().trim(),
      sort: this.sort(),
      dir: this.dir(),
      categoryName: this.category(),
      fromDate: this.fromDate(),
      toDate: this.toDate(),
      fromAmount: this.num(this.minAmount()),
      toAmount: this.num(this.maxAmount()),
      reload: this.reload(),
    }));
    toObservable(query)
      .pipe(
        debounceTime(120),
        tap(() => this.loading.set(true)),
        switchMap((q) => this.api.page(q, this.userId ?? undefined).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res) return;
        this.rows.set(res.data);
        this.filtered.set(res.recordsFiltered);
        this.total.set(res.recordsTotal);
        if (res.data.length === 0 && this.page() > 0) this.page.set(0);
      });

    if (this.userId) {
      this.usersApi.get(this.userId).subscribe((u) => this.viewedUser.set(u));
    } else {
      this.accountsApi.list().subscribe((a) => this.accounts.set(a));
      this.categoriesApi.list().subscribe((c) => this.categories.set(c));
      if (this.route.snapshot.queryParamMap.has('new')) {
        this.formOpen.set(true);
        void this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
    }
  }

  protected isIncome(tx: Transaction): boolean {
    return tx.category?.type === 'Income';
  }

  private num(raw: string): number | null {
    if (!raw.trim()) return null;
    const n = parseAmount(raw);
    return Number.isNaN(n) ? null : n;
  }

  protected onSearch(value: string): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.search.set(value);
      this.page.set(0);
    }, 250);
  }

  protected setFilter(target: { set(v: string): void }, value: string): void {
    target.set(value);
    this.page.set(0);
  }

  protected clearAll(): void {
    this.category.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.minAmount.set('');
    this.maxAmount.set('');
    this.search.set('');
    this.page.set(0);
  }

  protected toggleSort(key: 'date' | 'amount'): void {
    if (this.sort() === key) this.dir.set(this.dir() === 'asc' ? 'desc' : 'asc');
    else {
      this.sort.set(key);
      this.dir.set('desc');
    }
    this.page.set(0);
  }

  protected sortMark(key: 'date' | 'amount'): string {
    return this.sort() === key ? (this.dir() === 'asc' ? '↑' : '↓') : '';
  }

  protected openNew(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(tx: Transaction): void {
    this.editing.set(tx);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  protected onSaved(): void {
    this.closeForm();
    this.reload.update((n) => n + 1);
    this.accountsApi.list().subscribe((a) => this.accounts.set(a));
  }
}
