import { Injectable, computed, effect, signal } from '@angular/core';
import { en, TranslationKey } from './en';
import { pl } from './pl';

export type Lang = 'en' | 'pl';
export type { TranslationKey };

const STORAGE_KEY = 'hg.lang';
const dictionaries: Record<Lang, Record<TranslationKey, string>> = { en, pl };

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'pl') return saved;
  } catch {
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(detect());
  readonly acceptLanguage = computed(() => (this.lang() === 'pl' ? 'pl-PL' : 'en-US'));
  private readonly locale = computed(() => (this.lang() === 'pl' ? 'pl-PL' : 'en-US'));

  constructor() {
    effect(() => {
      const lang = this.lang();
      document.documentElement.lang = lang;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
      }
    });
  }

  set(lang: Lang): void {
    this.lang.set(lang);
  }

  readonly t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = dictionaries[this.lang()][key] ?? en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v));
    }
    return text;
  };

  readonly money = (value: number | null | undefined): string => {
    const n = new Intl.NumberFormat(this.locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);
    return `${n} zł`;
  };

  readonly number = (value: number | null | undefined): string =>
    new Intl.NumberFormat(this.locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0);

  readonly date = (iso: string | Date | null | undefined): string => {
    if (!iso) return '';
    return new Intl.DateTimeFormat(this.locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  };

  readonly dateTime = (iso: string | Date | null | undefined): string => {
    if (!iso) return '';
    return new Intl.DateTimeFormat(this.locale(), {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  };

  readonly time = (iso: string | Date | null | undefined): string => {
    if (!iso) return '';
    return new Intl.DateTimeFormat(this.locale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  };
}
