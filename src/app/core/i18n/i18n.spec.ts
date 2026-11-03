import { en } from './en';
import { pl } from './pl';

describe('translations', () => {
  it('EN and PL have exactly the same keys', () => {
    expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort());
  });

  it('PL has no empty values and keeps every {placeholder} of EN', () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(pl[key].trim(), key).not.toBe('');
      expect(ph(pl[key]), key).toEqual(ph(en[key]));
    }
  });
});
