/**
 * كيانات المجال لمتجر أوبتيما فون.
 *
 * هذه الأنواع مستقلة عن مصدر البيانات: الكتالوج المحلي اليوم،
 * أو واجهة خدمة عن بُعد لاحقًا، كلاهما يُسقَط على هذه الأنواع.
 */

import type { PaymentMethodId } from '../config/store';

export type { PaymentMethodId };

/** معرّف فئة — يُشتق من الأصناف المتاحة فعليًا في الكتالوج. */
export type CategoryId = string;

/** معرّف علامة تجارية — يُشتق من الأصناف المتاحة فعليًا. */
export type BrandId = string;

export interface Category {
  id: CategoryId;
  name: string;
}

export interface Brand {
  id: BrandId;
  name: string;
}

export interface ColorOption {
  /** اسم اللون كما يظهر للعميل */
  name: string;
  /** قيمة اللون بصيغة #rrggbb */
  hex: string;
}

export interface ProductVariant {
  id: string;
  color?: ColorOption;
  /** سعة التخزين، إن وُجدت */
  storage?: string;
  /** حجم الذاكرة، إن وُجد */
  ram?: string;
  /** السعر بالجنيه المصري */
  price: number;
  /** السعر قبل التخفيض، إن وُجد تخفيض حقيقي */
  compareAtPrice?: number;
  /** الكمية المتوفرة فعليًا في المخزن */
  stock: number;
}

export interface SpecGroup {
  title: string;
  specs: { label: string; value: string }[];
}

export interface Product {
  id: string;
  name: string;
  tagline?: string;
  brand: BrandId;
  brandName: string;
  category: CategoryId;
  categoryName: string;
  /**
   * مسارات صور المنتج داخل مجلد public — مثال: '/products/example.jpg'
   * تُستضاف الصور محليًا ولا تُطلب من أي نطاق خارجي.
   */
  images: string[];
  description?: string;
  highlights?: string[];
  specGroups?: SpecGroup[];
  variants: ProductVariant[];
  /** مدة الضمان بالأشهر */
  warrantyMonths?: number;
  /** يظهر ضمن الواجهة الرئيسية */
  featured?: boolean;
}

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

/** بيانات المستلِم — تبقى في الذاكرة فقط ولا تُحفظ على الجهاز. */
export interface Recipient {
  name: string;
  phone: string;
  city: string;
  address: string;
}

/** إثبات التحويل — يبقى في الذاكرة فقط ولا يُرفع إلى أي خادم. */
export interface TransferProof {
  /** الرقم الذي أُرسل منه التحويل */
  senderNumber: string;
  /** قيمة التحويل */
  amount: number;
  /** اسم ملف الإيصال، للعرض فقط */
  receiptName?: string;
}

export interface OrderLine {
  productName: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
}

/**
 * الطلب كما يُحفظ على الجهاز: بلا اسم أو هاتف أو عنوان.
 * بيانات المستلِم تُرسَل عبر الواتساب فحسب ولا تُخزَّن.
 */
export interface StoredOrder {
  id: string;
  number: string;
  placedAt: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  payment: PaymentMethodId;
}

/** الطلب المكتمل أثناء الجلسة، متضمنًا البيانات غير المحفوظة. */
export interface Order extends StoredOrder {
  recipient: Recipient;
  proof?: TransferProof;
}
