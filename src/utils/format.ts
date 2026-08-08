import { STORE } from '../config/store';

/**
 * تنسيق المبالغ والتواريخ.
 * تُعرض الأرقام بالخانات اللاتينية لوضوحها في جميع الأقطار العربية.
 */

const priceFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatPrice(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${priceFormatter.format(safe)} ${STORE.currency.symbol}`;
}

export function formatNumber(value: number): string {
  return priceFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}

export function discountPercent(price: number, compareAt: number): number | null {
  if (!(compareAt > price) || price <= 0) return null;
  return Math.round((1 - price / compareAt) * 100);
}

/**
 * معرّف عشوائي يُولَّد على الجهاز باستخدام مولّد الأرقام العشوائية
 * المؤمَّن في المتصفح.
 */
export function secureId(prefix: string): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('');
  return `${prefix}_${body}`;
}

/** رقم طلب من ستة أرقام، مولَّد عشوائيًا بصورة مؤمَّنة. */
export function orderNumber(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return `OP-${(100000 + (bytes[0] % 900000)).toString()}`;
}

export function variantLabel(parts: Array<string | undefined>): string {
  return parts.filter((p): p is string => Boolean(p)).join(' · ');
}
