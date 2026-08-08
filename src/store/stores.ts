import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORE } from '../config/store';
import { catalog } from '../data/localCatalogRepository';
import type { CartLine, Order, StoredOrder } from '../domain/entities';

/**
 * ── حالة المتجر ──────────────────────────────────────────────
 *
 * ما يُحفظ على الجهاز محصور فيما لا يُعرّف بصاحبه: معرّفات الأصناف
 * والكميات وأرقام الطلبات. أما الاسم والهاتف والعنوان وإيصال
 * التحويل فتبقى في الذاكرة طوال الجلسة ثم تزول.
 */

const STORAGE_KEYS = ['optima.cart', 'optima.wishlist', 'optima.orders', 'optima.theme'] as const;

/* ── السمة ───────────────────────────────────────────────────── */

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      toggle: () => set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'optima.theme' },
  ),
);

/* ── السلة ───────────────────────────────────────────────────── */

export interface CartTotals {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
}

interface CartState {
  lines: CartLine[];
  add: (productId: string, variantId: string, quantity?: number) => void;
  remove: (productId: string, variantId: string) => void;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  clear: () => void;
}

const MAX_QUANTITY_PER_LINE = 20;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      add: (productId, variantId, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find(
            (l) => l.productId === productId && l.variantId === variantId,
          );
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l === existing
                  ? {
                      ...l,
                      quantity: Math.min(l.quantity + quantity, MAX_QUANTITY_PER_LINE),
                    }
                  : l,
              ),
            };
          }
          return {
            lines: [
              ...s.lines,
              { productId, variantId, quantity: Math.min(quantity, MAX_QUANTITY_PER_LINE) },
            ],
          };
        }),

      remove: (productId, variantId) =>
        set((s) => ({
          lines: s.lines.filter(
            (l) => !(l.productId === productId && l.variantId === variantId),
          ),
        })),

      setQuantity: (productId, variantId, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter(
                  (l) => !(l.productId === productId && l.variantId === variantId),
                )
              : s.lines.map((l) =>
                  l.productId === productId && l.variantId === variantId
                    ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY_PER_LINE) }
                    : l,
                ),
        })),

      clear: () => set({ lines: [] }),
    }),
    { name: 'optima.cart' },
  ),
);

/** يحسب إجماليات السلة من الأسعار الحقيقية وقت العرض. */
export function computeCart(lines: CartLine[]): CartTotals {
  let subtotal = 0;
  let itemCount = 0;

  for (const line of lines) {
    const product = catalog.getById(line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant) continue;
    subtotal += variant.price * line.quantity;
    itemCount += line.quantity;
  }

  const { fee, freeOver } = STORE.shipping;
  const qualifiesForFree = freeOver !== null && subtotal >= freeOver;
  const shipping = subtotal === 0 || qualifiesForFree ? 0 : fee;

  return { subtotal, shipping, total: subtotal + shipping, itemCount };
}

export function useCartTotals(): CartTotals {
  const lines = useCartStore((s) => s.lines);
  return computeCart(lines);
}

/* ── المفضلة ─────────────────────────────────────────────────── */

interface WishlistState {
  ids: string[];
  toggle: (productId: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (productId) =>
        set((s) => ({
          ids: s.ids.includes(productId)
            ? s.ids.filter((id) => id !== productId)
            : [productId, ...s.ids].slice(0, 100),
        })),
      clear: () => set({ ids: [] }),
    }),
    { name: 'optima.wishlist' },
  ),
);

/* ── الطلبات ─────────────────────────────────────────────────── */

interface OrdersState {
  orders: StoredOrder[];
  place: (order: Order) => void;
  clear: () => void;
}

/** يُجرَّد الطلب من كل بيان شخصي قبل حفظه على الجهاز. */
function stripPersonalData(order: Order): StoredOrder {
  return {
    id: order.id,
    number: order.number,
    placedAt: order.placedAt,
    lines: order.lines,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    payment: order.payment,
  };
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      place: (order) =>
        set((s) => ({ orders: [stripPersonalData(order), ...s.orders].slice(0, 50) })),
      clear: () => set({ orders: [] }),
    }),
    { name: 'optima.orders' },
  ),
);

/* ── الطلب الجاري ────────────────────────────────────────────── */

interface ActiveOrderState {
  /** الطلب الأخير كاملًا، في الذاكرة فقط ولا يُحفظ إطلاقًا. */
  order: Order | null;
  /** رابط معاينة الإيصال، يُلغى عند الانتهاء. */
  receiptPreview: string | null;
  receiptFile: File | null;
  setOrder: (order: Order) => void;
  setReceipt: (file: File | null) => void;
  reset: () => void;
}

export const useActiveOrderStore = create<ActiveOrderState>((set, get) => ({
  order: null,
  receiptPreview: null,
  receiptFile: null,

  setOrder: (order) => set({ order }),

  setReceipt: (file) => {
    const previous = get().receiptPreview;
    if (previous) URL.revokeObjectURL(previous);
    set({
      receiptFile: file,
      receiptPreview: file ? URL.createObjectURL(file) : null,
    });
  },

  reset: () => {
    const previous = get().receiptPreview;
    if (previous) URL.revokeObjectURL(previous);
    set({ order: null, receiptFile: null, receiptPreview: null });
  },
}));

/* ── محو البيانات ────────────────────────────────────────────── */

/** يمحو كل ما حفظه المتجر على هذا الجهاز محوًا تامًا. */
export function eraseAllLocalData(): void {
  useActiveOrderStore.getState().reset();
  useCartStore.setState({ lines: [] });
  useWishlistStore.setState({ ids: [] });
  useOrdersStore.setState({ orders: [] });
  for (const key of STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* التخزين غير متاح — لا شيء يُمحى */
    }
  }
}
