import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { I18n, TranslationKey } from '../../core/i18n/i18n.service';

export function passwordChecks(pw: string): { key: TranslationKey; ok: boolean }[] {
  return [
    { key: 'password.rule.length', ok: pw.length >= 6 },
    { key: 'password.rule.upper', ok: /[A-Z]/.test(pw) },
    { key: 'password.rule.lower', ok: /[a-z]/.test(pw) },
    { key: 'password.rule.digit', ok: /\d/.test(pw) },
    { key: 'password.rule.special', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export const passwordValidator: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  const v = String(c.value ?? '');
  if (!v) return null;
  if (v.length > 100) return { maxlength: { requiredLength: 100, actualLength: v.length } };
  return passwordChecks(v).every((r) => r.ok) ? null : { password: true };
};

export function parseAmount(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  const s = String(raw ?? '').replace(/[\s ]/g, '').replace(',', '.');
  if (s === '' || !/^-?\d*\.?\d+$/.test(s)) return NaN;
  return Number(s);
}

export const amountValidator =
  (opts: { min?: number; positive?: boolean } = {}): ValidatorFn =>
  (c) => {
    const raw = c.value;
    if (raw === null || raw === undefined || String(raw).trim() === '') return null;
    const n = parseAmount(raw);
    if (Number.isNaN(n)) return { amount: true };
    if (opts.positive && n <= 0) return { positive: true };
    if (opts.min !== undefined && n < opts.min) return { min: { min: opts.min } };
    return null;
  };

export const matchValidator =
  (other: string): ValidatorFn =>
  (c) => {
    const parent = c.parent;
    if (!parent) return null;
    return parent.get(other)?.value === c.value ? null : { mismatch: true };
  };

export function fieldError(c: AbstractControl | null, t: I18n['t']): string | null {
  if (!c || !c.invalid || !(c.touched || c.dirty)) return null;
  const e = c.errors ?? {};
  if (e['required']) return t('validation.required');
  if (e['email']) return t('validation.email');
  if (e['maxlength']) return t('validation.tooLong', { max: e['maxlength'].requiredLength });
  if (e['amount']) return t('validation.amount');
  if (e['positive']) return t('validation.positive');
  if (e['min']) return t('validation.min', { min: e['min'].min });
  if (e['mismatch']) return t('validation.mismatch');
  if (e['password']) return t('validation.password');
  return t('validation.invalid');
}
