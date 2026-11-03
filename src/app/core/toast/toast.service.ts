import { Injectable, inject, signal } from '@angular/core';
import { ApiError } from '../api/api-error';
import { I18n } from '../i18n/i18n.service';

export type ToastKind = 'error' | 'success' | 'warning' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  items: string[];
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly i18n = inject(I18n);
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  success(title: string): void {
    this.push('success', title, [], 4000);
  }

  info(title: string): void {
    this.push('info', title, [], 5000);
  }

  warning(title: string, items: string[] = []): void {
    this.push('warning', title, items, 7000);
  }

  error(err: ApiError): void {
    const { title, items } = describeError(err, this.i18n.t);
    this.push('error', title, items, 8000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, title: string, items: string[], ttl: number): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list.slice(-3), { id, kind, title, items }]);
    setTimeout(() => this.dismiss(id), ttl);
  }
}

export function describeError(
  err: ApiError,
  t: I18n['t'],
): { title: string; items: string[] } {
  if (err.hasServerText) return { title: err.message, items: err.errors };
  switch (err.kind) {
    case 'network':
      return { title: t('error.network'), items: [] };
    case 'server':
      return { title: t('error.server'), items: [] };
    case 'auth':
      return { title: t('error.auth'), items: err.errors };
    case 'forbidden':
      return { title: t('error.forbidden'), items: err.errors };
    case 'notFound':
      return { title: t('error.notFound'), items: err.errors };
    default:
      return { title: t('error.generic'), items: err.errors };
  }
}
