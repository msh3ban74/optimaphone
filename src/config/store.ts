/**
 * إعدادات المتجر — المصدر الوحيد لكل بيانات التاجر.
 *
 * كل قيمة هنا حقيقية ويحددها صاحب المتجر. لا تُضاف أي بيانات
 * تقديرية أو تجريبية إلى هذا الملف.
 */

export interface PaymentChannel {
  id: PaymentMethodId;
  /** الاسم المعروض للعميل */
  label: string;
  /** وصف موجز يظهر تحت الاسم */
  note: string;
  /** هل يتطلب إثبات تحويل (رقم المُرسِل + المبلغ + الإيصال) */
  requiresProof: boolean;
  /** هل الوسيلة مفعّلة في المتجر */
  enabled: boolean;
}

export type PaymentMethodId = 'wallet' | 'instapay' | 'cod' | 'cash';

export const STORE = {
  /** الاسم التجاري */
  name: 'أوبتيما فون',
  nameLatin: 'OptimaPhone',
  tagline: 'وجهتك المختارة لأرقى الأجهزة',

  /**
   * رقم الواتساب الذي تصل إليه الطلبات، والرقم الذي تُرسَل إليه
   * التحويلات المالية. بصيغة دولية بدون علامة زائد.
   */
  whatsapp: '201066659105',
  /** الصيغة المحلية المعروضة للعميل */
  transferNumberLocal: '01066659105',

  facebook: 'https://www.facebook.com/share/1EwaUZQ2ne/',

  currency: {
    code: 'EGP',
    /** الرمز المعروض بجانب المبالغ */
    symbol: 'ج.م',
  },

  /**
   * الشحن — القيم التي يحددها صاحب المتجر.
   * اجعل freeOver مساويًا لـ null لتعطيل الشحن المجاني.
   */
  shipping: {
    fee: 0,
    freeOver: null as number | null,
  },
} as const;

export const PAYMENT_CHANNELS: PaymentChannel[] = [
  {
    id: 'instapay',
    label: 'إنستاباي',
    note: `التحويل إلى ${STORE.transferNumberLocal}`,
    requiresProof: true,
    enabled: true,
  },
  {
    id: 'wallet',
    label: 'محفظة إلكترونية',
    note: `التحويل إلى ${STORE.transferNumberLocal}`,
    requiresProof: true,
    enabled: true,
  },
  {
    id: 'cod',
    label: 'الدفع عند الاستلام',
    note: 'السداد نقدًا لمندوب التوصيل',
    requiresProof: false,
    enabled: true,
  },
  {
    id: 'cash',
    label: 'السداد نقدًا في المعرض',
    note: 'الاستلام والسداد من المقر مباشرة',
    requiresProof: false,
    // فعّل هذه الوسيلة عند توفر معرض لاستقبال العملاء.
    enabled: false,
  },
];

export const ACTIVE_PAYMENT_CHANNELS = PAYMENT_CHANNELS.filter((c) => c.enabled);

export function paymentChannel(id: PaymentMethodId): PaymentChannel | undefined {
  return PAYMENT_CHANNELS.find((c) => c.id === id);
}

/** حدود التحقق من إيصال التحويل. */
export const RECEIPT_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;
