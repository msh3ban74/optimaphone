/** Currency + misc formatting helpers. */

export function formatPrice(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const [int, frac] = rounded.toFixed(2).split('.');
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac === '00' ? `$${withCommas}` : `$${withCommas}.${frac}`;
}

export function formatCompactCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function percentOff(price: number, compareAt: number): number {
  return Math.round((1 - price / compareAt) * 100);
}

export interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export function countdownTo(iso: string, now: number = Date.now()): Countdown {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  };
}

export function two(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Deterministic-enough id for orders/addresses created on-device. */
export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function orderNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `OP-${n}`;
}

export function deliveryEstimate(daysFrom: number, daysTo: number): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const from = new Date();
  from.setDate(from.getDate() + daysFrom);
  const to = new Date();
  to.setDate(to.getDate() + daysTo);
  return `${fmt(from)} – ${fmt(to)}`;
}
