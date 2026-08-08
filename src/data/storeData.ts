import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { PAYMENT_CHANNELS, STORE } from '../config/store';
import type {
  AdminOrder,
  Coupon,
  DataSnapshot,
  OrderStatus,
  StoreSettings,
} from '../domain/admin';
import type { Product } from '../domain/entities';
import { PRODUCTS } from './catalog';

/**
 * ── مصدر بيانات المتجر ───────────────────────────────────────
 *
 * هذا هو المصدر الوحيد للأصناف وكروت الخصم والطلبات والإعدادات،
 * يقرأ منه الموقع ولوحة الإدارة معًا.
 *
 * يُحفَظ اليوم في متصفح الجهاز الذي يُدار منه المتجر. الواجهة
 * البرمجية أدناه هي كامل ما تحتاجه أي خدمة عن بُعد لاحقًا: يكفي
 * استبدال جسم كل دالة بنداء شبكة، وتبقى كل الشاشات كما هي.
 *
 * ملاحظة جوهرية: ما دام الحفظ محليًا، فالتعديل يظهر على جهاز
 * التاجر وحده. لنشر الأصناف لكل الزوار تُصدَّر من صفحة النسخ
 * الاحتياطي ويُستبدل بها ملف `src/data/catalog.ts`.
 */

export const DEFAULT_SETTINGS: StoreSettings = {
  name: STORE.name,
  tagline: STORE.tagline,
  whatsapp: STORE.whatsapp,
  transferNumberLocal: STORE.transferNumberLocal,
  facebook: STORE.facebook,
  shippingFee: STORE.shipping.fee,
  freeShippingOver: STORE.shipping.freeOver,
  lowStockThreshold: 3,
  payments: PAYMENT_CHANNELS.map((c) => ({ id: c.id, enabled: c.enabled })),
  showNumberInFooter: false,
};

interface StoreDataState {
  products: Product[];
  coupons: Coupon[];
  orders: AdminOrder[];
  settings: StoreSettings;
  /** هل زُرعت الأصناف من ملف الكتالوج مرة واحدة */
  seeded: boolean;

  /* الأصناف */
  saveProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  duplicateProduct: (id: string) => string | null;
  setProducts: (products: Product[]) => void;
  adjustStock: (productId: string, variantId: string, delta: number) => void;

  /* كروت الخصم */
  saveCoupon: (coupon: Coupon) => void;
  removeCoupon: (id: string) => void;
  markCouponUsed: (code: string) => void;

  /* الطلبات */
  addOrder: (order: AdminOrder) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  setOrderNote: (id: string, note: string) => void;
  removeOrder: (id: string) => void;

  /* الإعدادات والنسخ */
  saveSettings: (settings: StoreSettings) => void;
  importSnapshot: (snapshot: DataSnapshot) => void;
  resetAll: () => void;
}

export const useStoreData = create<StoreDataState>()(
  persist(
    (set, get) => ({
      products: [],
      coupons: [],
      orders: [],
      settings: DEFAULT_SETTINGS,
      seeded: false,

      /* ── الأصناف ─────────────────────────────────────────── */

      saveProduct: (product) =>
        set((s) => {
          const index = s.products.findIndex((p) => p.id === product.id);
          if (index === -1) return { products: [product, ...s.products] };
          const products = s.products.slice();
          products[index] = product;
          return { products };
        }),

      removeProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      duplicateProduct: (id) => {
        const source = get().products.find((p) => p.id === id);
        if (!source) return null;
        let newId = `${source.id}-copy`;
        let n = 2;
        while (get().products.some((p) => p.id === newId)) {
          newId = `${source.id}-copy-${n}`;
          n += 1;
        }
        const copy: Product = {
          ...structuredClone(source),
          id: newId,
          name: `${source.name} (نسخة)`,
          featured: false,
        };
        set((s) => ({ products: [copy, ...s.products] }));
        return newId;
      },

      setProducts: (products) => set({ products, seeded: true }),

      adjustStock: (productId, variantId, delta) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id !== productId
              ? p
              : {
                  ...p,
                  variants: p.variants.map((v) =>
                    v.id === variantId
                      ? { ...v, stock: Math.max(0, v.stock + delta) }
                      : v,
                  ),
                },
          ),
        })),

      /* ── كروت الخصم ──────────────────────────────────────── */

      saveCoupon: (coupon) =>
        set((s) => {
          const normalized = { ...coupon, code: coupon.code.trim().toUpperCase() };
          const index = s.coupons.findIndex((c) => c.id === normalized.id);
          if (index === -1) return { coupons: [normalized, ...s.coupons] };
          const coupons = s.coupons.slice();
          coupons[index] = normalized;
          return { coupons };
        }),

      removeCoupon: (id) => set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) })),

      markCouponUsed: (code) =>
        set((s) => ({
          coupons: s.coupons.map((c) =>
            c.code === code.trim().toUpperCase() ? { ...c, usedCount: c.usedCount + 1 } : c,
          ),
        })),

      /* ── الطلبات ─────────────────────────────────────────── */

      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders].slice(0, 500) })),

      setOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
          ),
        })),

      setOrderNote: (id, note) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, note, updatedAt: new Date().toISOString() } : o,
          ),
        })),

      removeOrder: (id) => set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),

      /* ── الإعدادات والنسخ ────────────────────────────────── */

      saveSettings: (settings) => set({ settings }),

      importSnapshot: (snapshot) =>
        set({
          products: (snapshot.products as Product[]) ?? [],
          coupons: snapshot.coupons ?? [],
          orders: snapshot.orders ?? [],
          settings: { ...DEFAULT_SETTINGS, ...snapshot.settings },
          seeded: true,
        }),

      resetAll: () =>
        set({
          products: structuredClone(PRODUCTS),
          coupons: [],
          orders: [],
          settings: DEFAULT_SETTINGS,
          seeded: true,
        }),
    }),
    {
      name: 'optima.data',
      version: 1,
      onRehydrateStorage: () => (state) => {
        // أول تشغيل: تُنقل أصناف ملف الكتالوج إلى المخزن مرة واحدة،
        // فيصير المخزن هو المرجع بعدها ولا يُدهس ما أضافه التاجر.
        if (state && !state.seeded) {
          state.setProducts(structuredClone(PRODUCTS));
        }
      },
    },
  ),
);

/* ── تمييز جهاز التاجر ──────────────────────────────────────── */

/**
 * هل هذا جهاز التاجر؟ يُعرف بوجود رمز إدارة مضبوط عليه.
 *
 * الفارق جوهري: دفتر الطلبات يحتفظ باسم العميل وهاتفه وعنوانه،
 * وهذا لازم للتاجر ليُنفّذ الطلب. أما على جهاز العميل فلا يُحفظ
 * منه شيء، وفاءً بما تَعِد به صفحة الخصوصية. ولا معنى للحفظ هناك
 * أصلًا، إذ لا يبلغ التاجرَ ما كُتب في متصفح غيره.
 *
 * تُقرأ الحالة من التخزين مباشرة كي لا تُجرّ حزمة الإدارة إلى
 * صفحات المتجر.
 */
export function isMerchantDevice(): boolean {
  try {
    const raw = localStorage.getItem('optima.admin.auth');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { hash?: string | null } };
    return typeof parsed.state?.hash === 'string' && parsed.state.hash.length > 0;
  } catch {
    return false;
  }
}

/* ── قراءات مباشرة، لما هو خارج دورة العرض ──────────────────── */

export function currentProducts(): Product[] {
  return useStoreData.getState().products;
}

export function currentSettings(): StoreSettings {
  return useStoreData.getState().settings;
}

export function currentCoupons(): Coupon[] {
  return useStoreData.getState().coupons;
}

/* ── تصدير لقطة كاملة ───────────────────────────────────────── */

export function buildSnapshot(): DataSnapshot {
  const { products, coupons, orders, settings } = useStoreData.getState();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    products,
    coupons,
    orders,
    settings,
  };
}
