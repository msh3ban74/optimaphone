/**
 * كيانات الإدارة.
 *
 * تُبقى مستقلة عن مصدر التخزين تمامًا: اليوم تُحفظ في متصفح
 * التاجر، وغدًا في خدمة عن بُعد، دون تغيير أي شاشة.
 */

import type { OrderLine, PaymentMethodId, Recipient } from './entities';

/* ── كروت الخصم ──────────────────────────────────────────────── */

export type DiscountKind = 'percent' | 'fixed' | 'shipping';

export interface Coupon {
  id: string;
  /** الرمز كما يكتبه العميل، يُخزَّن بحروف كبيرة دائمًا */
  code: string;
  kind: DiscountKind;
  /**
   * قيمة الخصم: نسبة مئوية لـ percent، ومبلغ بالجنيه لـ fixed،
   * وتُهمَل تمامًا لـ shipping (شحن مجاني).
   */
  value: number;
  /** أقل إجمالي للسلة يسمح باستعمال الكرت */
  minSubtotal?: number;
  /** سقف الخصم بالجنيه، يقيّد النسبة المئوية */
  maxDiscount?: number;
  /** عدد مرات الاستعمال المسموح بها، أو null لغير محدود */
  usageLimit?: number | null;
  /** عدد مرات الاستعمال الفعلية */
  usedCount: number;
  /** تاريخ بدء الصلاحية بصيغة ISO، أو null للبدء فورًا */
  startsAt?: string | null;
  /** تاريخ انتهاء الصلاحية بصيغة ISO، أو null لبلا انتهاء */
  expiresAt?: string | null;
  /** يقيّد الكرت بأصناف بعينها؛ فارغة تعني كل الأصناف */
  productIds?: string[];
  active: boolean;
  note?: string;
  createdAt: string;
}

/** نتيجة فحص كرت خصم على سلة بعينها. */
export interface CouponCheck {
  ok: boolean;
  coupon?: Coupon;
  /** قيمة الخصم على الأصناف */
  discount: number;
  /** هل يُسقط الشحن */
  freeShipping: boolean;
  reason?: string;
}

/* ── الطلبات ─────────────────────────────────────────────────── */

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUSES: { id: OrderStatus; label: string; tone: string }[] = [
  { id: 'new', label: 'جديد', tone: 'info' },
  { id: 'confirmed', label: 'مؤكَّد', tone: 'good' },
  { id: 'preparing', label: 'قيد التجهيز', tone: 'warn' },
  { id: 'shipped', label: 'مُرسَل', tone: 'warn' },
  { id: 'delivered', label: 'مُسلَّم', tone: 'good' },
  { id: 'cancelled', label: 'ملغى', tone: 'bad' },
];

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUSES.find((s) => s.id === status)?.label ?? status;
}

/**
 * الطلب في دفتر التاجر. على خلاف الطلب المحفوظ في جهاز العميل،
 * يحتفظ هذا بالبيانات اللازمة لتنفيذ الطلب وتسليمه.
 */
export interface AdminOrder {
  id: string;
  number: string;
  placedAt: string;
  updatedAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment: PaymentMethodId;
  couponCode?: string;
  recipient: Recipient;
  /** ملاحظة داخلية لا يراها العميل */
  note?: string;
  /** مصدر الطلب: من الموقع، أو أدخله التاجر يدويًا */
  source: 'storefront' | 'manual';
}

/* ── إعدادات المتجر ──────────────────────────────────────────── */

export interface PaymentChannelSetting {
  id: PaymentMethodId;
  enabled: boolean;
}

/**
 * الإعدادات التي يملك التاجر تغييرها من لوحة الإدارة. ما لم يُضبط
 * منها يعود إلى قيمة `STORE` في ملف الإعدادات.
 */
export interface StoreSettings {
  name: string;
  tagline: string;
  whatsapp: string;
  transferNumberLocal: string;
  facebook: string;
  shippingFee: number;
  freeShippingOver: number | null;
  /** حد التنبيه لقلة المخزون */
  lowStockThreshold: number;
  payments: PaymentChannelSetting[];
  /** إظهار رقم التحويل في تذييل الموقع */
  showNumberInFooter: boolean;
}

/* ── لقطة البيانات كاملة، للنسخ الاحتياطي ───────────────────── */

export interface DataSnapshot {
  version: 1;
  exportedAt: string;
  products: unknown[];
  coupons: Coupon[];
  orders: AdminOrder[];
  settings: StoreSettings;
}
