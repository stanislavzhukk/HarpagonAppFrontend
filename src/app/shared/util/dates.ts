export function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export type Period = 'this' | 'last' | '30' | 'custom';

export function rangeFor(period: Exclude<Period, 'custom'>, now = new Date()): { from: string; to: string } {
  if (period === 'this') return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
  if (period === 'last') return { from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: iso(new Date(now.getFullYear(), now.getMonth(), 0)) };
  const from = new Date(now);
  from.setDate(from.getDate() - 29);
  return { from: iso(from), to: iso(now) };
}
