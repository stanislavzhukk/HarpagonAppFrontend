import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
const KEY = 'hg.theme';

function saved(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
  }
  return 'system';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(saved());
  readonly isDark = signal(false);
  private readonly media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

  constructor() {
    this.media?.addEventListener('change', () => this.apply());
    effect(() => {
      const m = this.mode();
      try {
        localStorage.setItem(KEY, m);
      } catch {
      }
      this.apply();
    });
  }

  set(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  toggle(): void {
    this.mode.set(this.isDark() ? 'light' : 'dark');
  }

  private apply(): void {
    const m = this.mode();
    const dark = m === 'dark' || (m === 'system' && !!this.media?.matches);
    this.isDark.set(dark);
    document.documentElement.classList.toggle('dark', dark);
  }
}
