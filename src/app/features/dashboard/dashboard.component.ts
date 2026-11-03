import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Account, Dashboard, Transaction } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { I18n, TranslationKey } from '../../core/i18n/i18n.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { Period, rangeFor } from '../../shared/util/dates';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsService } from '../transactions/transactions.service';
import { DashboardService } from './dashboard.service';

interface Slice { name: string; value: number; pct: number; color: string }

function slices(map: Record<string, number>): Slice[] {
  const entries = Object.entries(map).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  return entries.map(([name, value], i) => ({ name, value, pct: (value / total) * 100, color: `var(--c${(i % 7) + 1})` }));
}

@Component({
  selector: 'hg-dashboard',
  imports: [PageHeaderComponent, IconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hg-page-header [title]="greeting()" [subtitle]="t('dash.subtitle')">
      <a routerLink="/transactions" [queryParams]="{ new: 1 }" class="btn btn-primary"><hg-icon name="plus" [size]="16" />{{ t('tx.new') }}</a>
    </hg-page-header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="seg" role="group">
        @for (p of periods; track p.id) {
          <button type="button" [class.on]="period() === p.id" (click)="setPeriod(p.id)">{{ t(p.label) }}</button>
        }
      </div>
      @if (period() === 'custom') {
        <div class="input !min-h-9"><input type="date" [value]="from()" (change)="from.set($any($event.target).value)" [attr.aria-label]="t('filter.from')" /></div>
        <span class="text-ink-3">–</span>
        <div class="input !min-h-9"><input type="date" [value]="to()" (change)="to.set($any($event.target).value)" [attr.aria-label]="t('filter.to')" /></div>
      } @else {
        <span class="badge"><hg-icon name="calendar" [size]="14" class="mr-1.5" />{{ i18n.date(from()) }} – {{ i18n.date(to()) }}</span>
      }
      <span class="flex-1"></span>
      @if (data(); as d) { <span class="text-xs text-ink-3">{{ t('dash.updated') }} {{ i18n.time(d.lastUpdated) }}</span> }
    </div>

    @if (loading() && !data()) {
      <div class="card p-10 text-center text-ink-3">{{ t('common.loading') }}</div>
    } @else if (data(); as d) {
      <div class="grid gap-5 lg:grid-cols-[1fr_260px_260px]">
        <section class="relative min-h-[204px] overflow-hidden rounded-[20px] border border-line bg-nav p-7 text-nav-text shadow-card">
          <span class="absolute -top-[90px] -right-[70px] size-[260px] rounded-full border-[30px] border-brass opacity-90"></span>
          <span class="absolute -bottom-[60px] right-[150px] size-[140px] rounded-full border-[3px] border-brass opacity-35"></span>
          <div class="over relative text-nav-muted">{{ t('dash.balance') }}</div>
          <div class="disp-xl relative mt-2">{{ i18n.number(d.currentTotalBalance) }} <span class="text-[32px] text-nav-accent">zł</span></div>
          <div class="relative mt-5 flex gap-2">
            <span class="badge !bg-nav-active !text-nav-text">{{ t('dash.accounts', { n: accounts().length }) }}</span>
            @if (savedPct() !== null) { <span class="badge !bg-brass !text-[#241A14]">{{ t('dash.saved', { n: savedPct()! }) }}</span> }
          </div>
        </section>
        <section class="card flex flex-col gap-2 p-5">
          <div class="flex items-center gap-2 text-ink-2"><span class="ico-ch !size-8 !bg-income-bg !text-income"><hg-icon name="down" [size]="16" /></span>{{ t('dash.income') }}</div>
          <div class="fig-l mt-1.5 text-income">{{ i18n.money(d.totalIncomes) }}</div>
          <div class="text-xs text-ink-3">{{ t('dash.sources', { n: incomeSlices().length }) }}</div>
        </section>
        <section class="card flex flex-col gap-2 p-5">
          <div class="flex items-center gap-2 text-ink-2"><span class="ico-ch !size-8 !bg-expense-bg !text-expense"><hg-icon name="up" [size]="16" /></span>{{ t('dash.expenses') }}</div>
          <div class="fig-l mt-1.5 text-expense">{{ i18n.money(d.totalExpenses) }}</div>
          <div class="text-xs text-ink-3">{{ t('dash.categoriesTx', { c: expenseSlices().length, n: d.transactionsCount }) }}</div>
        </section>
      </div>

      <div class="grid gap-5 lg:grid-cols-[1fr_400px]">
        <section class="card flex flex-col gap-5 p-6">
          <div class="flex items-center justify-between"><h2 class="h2">{{ t('dash.expensesBy') }}</h2><span class="text-xs text-ink-3">{{ i18n.money(d.totalExpenses) }}</span></div>
          @if (expenseSlices().length) {
            <div class="flex flex-wrap items-center gap-8">
              <div class="relative size-44 flex-none rounded-full" [style.background]="donut()">
                <div class="absolute inset-8 rounded-full bg-surface"></div>
                <div class="absolute inset-0 flex flex-col items-center justify-center text-center"><span class="text-xs text-ink-3">{{ t('dash.spent') }}</span><span class="fig-l">{{ i18n.number(d.totalExpenses).split(i18n.lang() === 'pl' ? ',' : '.')[0] }}</span></div>
              </div>
              <ul class="flex min-w-[220px] flex-1 flex-col gap-3">
                @for (s of expenseSlices(); track s.name) {
                  <li class="flex items-center gap-2"><span class="dot" [style.background]="s.color"></span><span class="flex-1 truncate">{{ s.name }}</span><span class="num">{{ i18n.number(s.value) }}</span><span class="w-10 text-right text-xs text-ink-3">{{ s.pct.toFixed(0) }}%</span></li>
                }
              </ul>
            </div>
          } @else { <p class="py-6 text-center text-ink-3">{{ t('dash.noExpenses') }}</p> }
        </section>
        <section class="card flex flex-col gap-5 p-6">
          <div class="flex items-center justify-between"><h2 class="h2">{{ t('dash.incomeBy') }}</h2><span class="text-xs text-ink-3">{{ i18n.money(d.totalIncomes) }}</span></div>
          @if (incomeSlices().length) {
            <div class="flex flex-col gap-4">
              @for (s of incomeSlices(); track s.name) {
                <div class="flex flex-col gap-2"><div class="flex justify-between"><span class="flex items-center gap-2"><span class="dot" [style.background]="s.color"></span>{{ s.name }}</span><span class="num">{{ i18n.number(s.value) }}</span></div><div class="bar !h-2.5"><i [style.width.%]="s.pct" [style.background]="s.color"></i></div></div>
              }
            </div>
            <div class="border-t border-line pt-4 text-[13px] text-ink-2">{{ insight() }}</div>
          } @else { <p class="py-6 text-center text-ink-3">{{ t('dash.noIncome') }}</p> }
        </section>
      </div>

      <section class="card flex flex-col gap-4 p-6">
        <div class="flex items-center justify-between"><h2 class="h2">{{ t('nav.accounts') }}</h2><a routerLink="/accounts" class="text-[13px] font-medium text-info">{{ t('dash.manage') }}</a></div>
        <div class="grid gap-4 md:grid-cols-3">
          @for (a of accounts(); track a.id) {
            <div class="flex flex-col gap-2 rounded-xl border border-line p-4">
              <div class="flex items-center justify-between"><b class="truncate font-medium">{{ a.name }}</b>
                @if (a.goal > 0) { <span class="badge badge-brass">{{ t('acc.goalPct', { n: goalPct(a) }) }}</span> } @else { <span class="badge">{{ t('acc.noGoal') }}</span> }</div>
              <div class="fig-l">{{ i18n.money(a.balance) }}</div>
              <div class="bar"><i [style.width.%]="goalPct(a)"></i></div>
              <span class="text-xs text-ink-3">{{ a.goal > 0 ? t('acc.goalOf', { v: i18n.money(a.goal) }) : t('acc.setGoalHint') }}</span>
            </div>
          }
        </div>
      </section>

      <section class="card overflow-hidden">
        <div class="flex items-center justify-between p-6 pb-4"><h2 class="h2">{{ t('dash.recent') }}</h2><a routerLink="/transactions" class="text-[13px] font-medium text-info">{{ t('dash.viewAll') }}</a></div>
        @for (tx of recent(); track tx.id) {
          <div class="flex items-center gap-3 border-t border-line px-6 py-3">
            <span class="ico-ch !size-8" [class]="isIncome(tx) ? '!bg-income-bg !text-income' : '!bg-expense-bg !text-expense'"><hg-icon [name]="isIncome(tx) ? 'down' : 'up'" [size]="16" /></span>
            <span class="min-w-0 flex-1"><b class="block truncate font-medium">{{ tx.description || tx.category?.name }}</b><span class="text-xs text-ink-3">{{ i18n.date(tx.date) }} · {{ tx.category?.name }} · {{ tx.account?.name }}</span></span>
            <span class="num" [class]="isIncome(tx) ? 'text-income' : 'text-expense'">{{ isIncome(tx) ? '+' : '−' }}{{ i18n.money(tx.amount) }}</span>
          </div>
        } @empty { <p class="border-t border-line p-8 text-center text-ink-3">{{ t('tx.empty') }}</p> }
      </section>
    }
  `,
})
export class DashboardComponent {
  protected readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly api = inject(DashboardService);
  private readonly accountsApi = inject(AccountsService);
  private readonly txApi = inject(TransactionsService);
  private readonly auth = inject(AuthService);

  protected readonly periods: { id: Period; label: TranslationKey }[] = [
    { id: 'this', label: 'period.this' },
    { id: 'last', label: 'period.last' },
    { id: '30', label: 'period.30' },
    { id: 'custom', label: 'period.custom' },
  ];
  protected readonly period = signal<Period>('this');
  protected readonly from = signal(rangeFor('this').from);
  protected readonly to = signal(rangeFor('this').to);
  protected readonly loading = signal(true);
  protected readonly data = signal<Dashboard | null>(null);
  protected readonly accounts = signal<Account[]>([]);
  protected readonly recent = signal<Transaction[]>([]);

  protected readonly expenseSlices = computed(() => slices(this.data()?.expensesByCategory ?? {}));
  protected readonly incomeSlices = computed(() => slices(this.data()?.incomesByCategory ?? {}));
  protected readonly donut = computed(() => {
    let acc = 0;
    const stops = this.expenseSlices().map((s) => `${s.color} ${acc.toFixed(2)}% ${(acc += s.pct).toFixed(2)}%`);
    return `conic-gradient(${stops.join(',')})`;
  });
  protected readonly savedPct = computed(() => {
    const d = this.data();
    if (!d || d.totalIncomes <= 0) return null;
    return Math.max(0, Math.round(((d.totalIncomes - d.totalExpenses) / d.totalIncomes) * 100));
  });
  protected readonly insight = computed(() => {
    const d = this.data();
    const top = this.expenseSlices()[0];
    if (!d || !top || d.totalExpenses <= 0) return '';
    return this.t('dash.insight', { x: (d.totalIncomes / d.totalExpenses).toFixed(1), cat: top.name, pct: top.pct.toFixed(0) });
  });
  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    const key: TranslationKey = h < 12 ? 'dash.morning' : h < 18 ? 'dash.afternoon' : 'dash.evening';
    return this.t(key, { name: this.auth.user()?.name ?? '' });
  });

  constructor() {
    effect(() => {
      const from = this.from();
      const to = this.to();
      if (!from || !to || from > to) return;
      this.load(from, to);
    });
    this.accountsApi.list().subscribe((a) => this.accounts.set(a));
    this.txApi.page({ start: 0, length: 5, sort: 'date', dir: 'desc' }).subscribe((r) => this.recent.set(r.data));
  }

  protected setPeriod(p: Period): void {
    this.period.set(p);
    if (p !== 'custom') {
      const r = rangeFor(p);
      this.from.set(r.from);
      this.to.set(r.to);
    }
  }

  protected isIncome(tx: Transaction): boolean {
    return tx.category?.type === 'Income';
  }

  protected goalPct(a: Account): number {
    return a.goal > 0 ? Math.min(100, Math.max(0, Math.round((a.balance / a.goal) * 100))) : 0;
  }

  private load(from: string, to: string): void {
    this.loading.set(true);
    this.api.get(from, to).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
