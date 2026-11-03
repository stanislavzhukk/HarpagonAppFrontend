import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../core/api/api-error';
import { Category, CategoryType } from '../../core/api/models';
import { I18n } from '../../core/i18n/i18n.service';
import { ToastService } from '../../core/toast/toast.service';
import { ErrorBannerComponent } from '../../shared/ui/error-banner.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { fieldError } from '../../shared/util/forms';
import { CategoriesService } from './categories.service';

@Component({
  selector: 'hg-categories',
  imports: [PageHeaderComponent, IconComponent, ModalComponent, ReactiveFormsModule, ErrorBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hg-page-header [title]="t('nav.categories')" [subtitle]="t('cat.subtitle')">
      <button type="button" class="btn btn-primary" (click)="openForm(null)"><hg-icon name="plus" [size]="16" />{{ t('cat.new') }}</button>
    </hg-page-header>
    <hg-error-banner [error]="error()" />

    <div class="grid gap-6 lg:grid-cols-2">
      @for (group of groups(); track group.type) {
        <section class="card overflow-hidden">
          <div class="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 class="h3">{{ group.type === 'Income' ? t('cat.income') : t('cat.expense') }}</h2>
            <span class="badge" [class]="group.type === 'Income' ? 'badge-income' : 'badge-expense'">{{ group.items.length }}</span>
          </div>
          <ul>
            @for (c of group.items; track c.id) {
              <li class="flex items-center gap-3 border-b border-line px-6 py-3 last:border-0">
                <span class="dot" [style.background]="group.type === 'Income' ? 'var(--income)' : 'var(--expense)'"></span>
                <div class="min-w-0 flex-1"><div class="truncate font-medium">{{ c.name }}</div>@if (c.description) { <div class="truncate text-xs text-ink-3">{{ c.description }}</div> }</div>
                @if (c.ownerId) {
                  <button type="button" class="p-1 text-ink-3 hover:text-ink" [attr.aria-label]="t('common.edit')" (click)="openForm(c)"><hg-icon name="edit" [size]="16" /></button>
                  <button type="button" class="p-1 text-ink-3 hover:text-danger" [attr.aria-label]="t('common.delete')" (click)="deleting.set(c)"><hg-icon name="trash" [size]="16" /></button>
                } @else {
                  <span class="badge" [title]="t('cat.systemHint')"><hg-icon name="lock" [size]="12" />{{ t('cat.system') }}</span>
                }
              </li>
            } @empty { <li class="px-6 py-8 text-center text-ink-3">{{ loading() ? t('common.loading') : t('cat.empty') }}</li> }
          </ul>
        </section>
      }
    </div>

    @if (formOpen()) {
      <hg-modal [heading]="editing() ? t('cat.edit') : t('cat.new')" (closed)="formOpen.set(false)">
        <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <hg-error-banner [error]="formError()" />
          <div class="seg w-full">
            <button type="button" class="flex-1" [class.on]="type() === 'Expense'" (click)="type.set('Expense')">{{ t('tx.expense') }}</button>
            <button type="button" class="flex-1" [class.on]="type() === 'Income'" (click)="type.set('Income')">{{ t('tx.income') }}</button>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="label" for="cat-name">{{ t('cat.name') }}</label>
            <div class="input" [class.invalid]="fe(form.controls.name)"><input id="cat-name" formControlName="name" /></div>
            @if (fe(form.controls.name); as m) { <span class="hint hint-error">{{ m }}</span> }
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="label" for="cat-desc">{{ t('field.descriptionOpt') }}</label>
            <div class="input" [class.invalid]="fe(form.controls.description)"><input id="cat-desc" formControlName="description" /></div>
            @if (fe(form.controls.description); as m) { <span class="hint hint-error">{{ m }}</span> }
          </div>
          <div class="flex justify-end gap-3"><button type="button" class="btn btn-secondary" (click)="formOpen.set(false)">{{ t('common.cancel') }}</button><button type="submit" class="btn btn-primary" [disabled]="busy()">{{ t('common.save') }}</button></div>
        </form>
      </hg-modal>
    }

    @if (deleting(); as d) {
      <hg-modal [heading]="t('cat.deleteQ', { name: d.name })" (closed)="deleting.set(null)">
        <p class="text-ink-2">{{ t('cat.deleteHint') }}</p>
        <hg-error-banner [error]="formError()" />
        <div class="flex justify-end gap-3"><button type="button" class="btn btn-secondary" (click)="deleting.set(null)">{{ t('common.cancel') }}</button><button type="button" class="btn btn-danger" [disabled]="busy()" (click)="confirmDelete()">{{ t('common.delete') }}</button></div>
      </hg-modal>
    }
  `,
})
export class CategoriesComponent {
  protected readonly t = inject(I18n).t;
  private readonly api = inject(CategoriesService);
  private readonly toasts = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly formError = signal<ApiError | null>(null);
  protected readonly busy = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Category | null>(null);
  protected readonly deleting = signal<Category | null>(null);
  protected readonly type = signal<CategoryType>('Expense');
  protected readonly groups = computed(() => (['Expense', 'Income'] as CategoryType[]).map((type) => ({ type, items: this.items().filter((c) => c.type === type) })));

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(200)],
  });
  protected readonly fe = (c: Parameters<typeof fieldError>[0]) => fieldError(c, this.t);

  constructor() {
    this.load();
  }

  private load(): void {
    this.api.list().subscribe({
      next: (c) => { this.items.set(c); this.loading.set(false); },
      error: (e: ApiError) => { this.error.set(e); this.loading.set(false); },
    });
  }

  protected openForm(c: Category | null): void {
    this.editing.set(c);
    this.type.set(c?.type ?? 'Expense');
    this.form.reset({ name: c?.name ?? '', description: c?.description ?? '' });
    this.formError.set(null);
    this.formOpen.set(true);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const e = this.editing();
    this.busy.set(true);
    this.formError.set(null);
    const call = e
      ? this.api.update({ categoryId: e.id, categoryName: v.name.trim(), type: this.type(), description: v.description.trim() || undefined })
      : this.api.create({ categoryName: v.name.trim(), type: this.type(), description: v.description.trim() || undefined });
    call.subscribe({
      next: () => { this.busy.set(false); this.formOpen.set(false); this.toasts.success(this.t(e ? 'cat.updated' : 'cat.created')); this.load(); },
      error: (err: ApiError) => { this.busy.set(false); this.formError.set(err); },
    });
  }

  protected confirmDelete(): void {
    const d = this.deleting();
    if (!d) return;
    this.busy.set(true);
    this.formError.set(null);
    this.api.remove(d.id).subscribe({
      next: () => { this.busy.set(false); this.deleting.set(null); this.toasts.success(this.t('cat.deleted')); this.load(); },
      error: (err: ApiError) => { this.busy.set(false); this.formError.set(err); },
    });
  }
}
