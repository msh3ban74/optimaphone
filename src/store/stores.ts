import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { catalog } from '../data/localCatalogRepository';
import { CartLine, Coupon, Order } from '../domain/entities';

/* ------------------------------------------------------------------ */
/* Theme                                                              */
/* ------------------------------------------------------------------ */

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
    { name: 'optima.web.theme' },
  ),
);

/* ------------------------------------------------------------------ */
/* Cart                                                               */
/* ------------------------------------------------------------------ */

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  itemCount: number;
}

const FREE_SHIPPING_THRESHOLD = 200;
const SHIPPING_FLAT = 12;

interface CartState {
  lines: CartLine[];
  coupon?: Coupon;
  add: (productId: string, variantId: string, quantity?: number) => void;
  remove: (productId: string, variantId: string) => void;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  applyCoupon: (code: string) => 'applied' | 'invalid' | 'below-minimum';
  removeCoupon: () => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      coupon: undefined,

      add: (productId, variantId, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find(
            (l) => l.productId === productId && l.variantId === variantId,
          );
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l === existing ? { ...l, quantity: l.quantity + quantity } : l,
              ),
            };
          }
          return { lines: [...s.lines, { productId, variantId, quantity }] };
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
                    ? { ...l, quantity }
                    : l,
                ),
        })),

      applyCoupon: (code) => {
        const coupon = catalog.findCoupon(code);
        if (!coupon) return 'invalid';
        const { subtotal } = computeCart(get().lines, undefined);
        if (subtotal < coupon.minSubtotal) return 'below-minimum';
        set({ coupon });
        return 'applied';
      },

      removeCoupon: () => set({ coupon: undefined }),
      clear: () => set({ lines: [], coupon: undefined }),
    }),
    { name: 'optima.web.cart' },
  ),
);

export function computeCart(lines: CartLine[], coupon?: Coupon): CartTotals {
  let subtotal = 0;
  let itemCount = 0;
  for (const line of lines) {
    const product = catalog.getById(line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant) continue;
    const dealActive =
      product.flashDeal && new Date(product.flashDeal.endsAt).getTime() > Date.now();
    const multiplier = dealActive ? 1 - product.flashDeal!.percentOff / 100 : 1;
    subtotal += variant.price * multiplier * line.quantity;
    itemCount += line.quantity;
  }

  let discount = 0;
  if (coupon && subtotal >= coupon.minSubtotal) {
    if (coupon.percentOff) discount = (subtotal * coupon.percentOff) / 100;
    if (coupon.amountOff) discount = Math.max(discount, coupon.amountOff);
    discount = Math.min(discount, subtotal);
  }

  const shipping =
    subtotal === 0 || subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

  return { subtotal, discount, shipping, total: subtotal - discount + shipping, itemCount };
}

export function useCartTotals(): CartTotals {
  const lines = useCartStore((s) => s.lines);
  const coupon = useCartStore((s) => s.coupon);
  return computeCart(lines, coupon);
}

/* ------------------------------------------------------------------ */
/* Wishlist                                                           */
/* ------------------------------------------------------------------ */

interface WishlistState {
  ids: string[];
  toggle: (productId: string) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (productId) =>
        set((s) => ({
          ids: s.ids.includes(productId)
            ? s.ids.filter((id) => id !== productId)
            : [productId, ...s.ids],
        })),
    }),
    { name: 'optima.web.wishlist' },
  ),
);

/* ------------------------------------------------------------------ */
/* Orders                                                             */
/* ------------------------------------------------------------------ */

interface OrdersState {
  orders: Order[];
  place: (order: Order) => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      place: (order) => set((s) => ({ orders: [order, ...s.orders] })),
    }),
    { name: 'optima.web.orders' },
  ),
);

/* ------------------------------------------------------------------ */
/* Recently viewed                                                    */
/* ------------------------------------------------------------------ */

interface RecentState {
  productIds: string[];
  record: (id: string) => void;
}

export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      productIds: [],
      record: (id) =>
        set((s) => ({
          productIds: [id, ...s.productIds.filter((p) => p !== id)].slice(0, 10),
        })),
    }),
    { name: 'optima.web.recent' },
  ),
);
