import { useEffect, useRef, useState, type ReactNode } from 'react';
import { create } from 'zustand';

import type { Product, ProductVariant } from '../domain/entities';
import { discountPercent, formatPrice } from '../utils/format';
import { safeHexColor, safeImagePath } from '../utils/security';

/* ── التنبيه العائم ──────────────────────────────────────────── */

interface ToastState {
  message: string | null;
  show: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    set({ message });
    window.setTimeout(() => set({ message: null }), 2400);
  },
}));

export function Toast() {
  const message = useToastStore((s) => s.message);
  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

/* ── الصور ───────────────────────────────────────────────────── */

/**
 * صورة صنف. لا تُعرض إلا المسارات الداخلية؛ أي رابط خارجي يُرفض
 * ويُستبدل بلوحة محايدة.
 */
export function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const safe = src ? safeImagePath(src) : null;

  if (!safe || failed) {
    return (
      <div className="media-blank" aria-hidden="true">
        أوبتيما فون
      </div>
    );
  }

  return <img src={safe} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

/* ── السعر ───────────────────────────────────────────────────── */

export function Price({
  variant,
  large = false,
}: {
  variant: ProductVariant | undefined;
  large?: boolean;
}) {
  if (!variant) return null;
  const off =
    variant.compareAtPrice !== undefined
      ? discountPercent(variant.price, variant.compareAtPrice)
      : null;

  return (
    <p className="price-row">
      <span className={large ? 'price price-xl' : 'price'}>{formatPrice(variant.price)}</span>
      {off !== null && variant.compareAtPrice !== undefined ? (
        <span className="price-was">{formatPrice(variant.compareAtPrice)}</span>
      ) : null}
    </p>
  );
}

/** أقل سعر متاح لصنف، لعرضه في البطاقات. */
export function cheapestVariant(product: Product): ProductVariant | undefined {
  if (product.variants.length === 0) return undefined;
  return product.variants.reduce((a, b) => (b.price < a.price ? b : a));
}

/* ── عيّنة اللون ─────────────────────────────────────────────── */

export function Swatch({
  color,
  selected,
  onSelect,
}: {
  color: { name: string; hex: string };
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  // تُضبط القيمة اللونية عبر الأسلوب البرمجي لا عبر سمة style،
  // فتبقى سياسة أمن المحتوى مانعة للأنماط المضمَّنة.
  useEffect(() => {
    if (ref.current) ref.current.style.backgroundColor = safeHexColor(color.hex);
  }, [color.hex]);

  return (
    <button
      type="button"
      className={selected ? 'swatch on' : 'swatch'}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={color.name}
      title={color.name}
    >
      <span ref={ref} />
    </button>
  );
}

/* ── الظهور عند التمرير ──────────────────────────────────────── */

export function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={shown ? 'reveal shown' : 'reveal'}>
      {children}
    </div>
  );
}

/* ── الحالة الفارغة ──────────────────────────────────────────── */

export function EmptyState({
  mark,
  title,
  body,
  action,
}: {
  mark: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-mark" aria-hidden="true">
        {mark}
      </span>
      <h2 className="h2">{title}</h2>
      <p className="lede">{body}</p>
      {action}
    </div>
  );
}

/* ── مقياس الكمية ────────────────────────────────────────────── */

export function Quantity({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="qty">
      <button type="button" onClick={() => onChange(value - 1)} aria-label="إنقاص الكمية">
        −
      </button>
      <output className="tnum">{value}</output>
      <button
        type="button"
        onClick={() => onChange(Math.min(value + 1, max))}
        disabled={value >= max}
        aria-label="زيادة الكمية"
      >
        +
      </button>
    </div>
  );
}
