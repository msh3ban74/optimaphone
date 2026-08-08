import { useEffect, useState } from 'react';
import { create } from 'zustand';

import { Product, ProductVariant } from '../domain/entities';
import { countdownTo, formatPrice, two } from '../utils/format';

/* ---------- toast ---------- */

interface ToastState {
  message: string | null;
  show: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    set({ message });
    setTimeout(() => set({ message: null }), 2200);
  },
}));

export function Toast() {
  const message = useToastStore((s) => s.message);
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

/* ---------- stars ---------- */

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" aria-label={`التقييم ${rating} من 5`}>
      {'★'.repeat(full)}
      {'☆'.repeat(5 - full)}
    </span>
  );
}

/* ---------- price ---------- */

export function effectivePrice(product: Product, variant: ProductVariant): number {
  const dealActive =
    product.flashDeal && new Date(product.flashDeal.endsAt).getTime() > Date.now();
  return dealActive
    ? variant.price * (1 - product.flashDeal!.percentOff / 100)
    : variant.price;
}

export function Price({
  product,
  variant,
  large = false,
}: {
  product: Product;
  variant?: ProductVariant;
  large?: boolean;
}) {
  const v = variant ?? product.variants[0];
  const eff = effectivePrice(product, v);
  const dealActive =
    product.flashDeal && new Date(product.flashDeal.endsAt).getTime() > Date.now();
  const original = dealActive ? v.price : v.compareAtPrice;

  return (
    <div className="price-row">
      <span className={`price${large ? ' price-lg' : ''}`}>{formatPrice(eff)}</span>
      {original && original > eff ? (
        <span className="price-old">{formatPrice(original)}</span>
      ) : null}
    </div>
  );
}

/* ---------- countdown ---------- */

export function Countdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const cd = countdownTo(endsAt, now);
  if (cd.expired) return <span style={{ color: 'var(--text-faint)' }}>انتهى العرض</span>;

  return (
    <span className="countdown" aria-label="الوقت المتبقي">
      <span className="countdown-cell">{two(cd.hours)}</span>
      <span className="countdown-sep">:</span>
      <span className="countdown-cell">{two(cd.minutes)}</span>
      <span className="countdown-sep">:</span>
      <span className="countdown-cell">{two(cd.seconds)}</span>
    </span>
  );
}

/* ---------- reveal on scroll ---------- */

export function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div
      ref={setRef}
      className={`reveal${visible ? ' visible' : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
