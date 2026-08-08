import type { Coupon, CouponCheck } from '../domain/admin';
import type { CartLine } from '../domain/entities';
import { catalog } from '../data/localCatalogRepository';
import { currentCoupons } from '../data/storeData';

/**
 * فحص كروت الخصم وتطبيقها.
 *
 * الفحص كله هنا في موضع واحد، فتستعمله السلة وصفحة الدفع ولوحة
 * الإدارة بنتيجةٍ واحدة لا تختلف بينها.
 */

const NO_DISCOUNT: CouponCheck = { ok: false, discount: 0, freeShipping: false };

function withinDates(coupon: Coupon, now: number): string | null {
  if (coupon.startsAt) {
    const start = new Date(coupon.startsAt).getTime();
    if (Number.isFinite(start) && now < start) return 'الكرت لم يبدأ سريانه بعد.';
  }
  if (coupon.expiresAt) {
    const end = new Date(coupon.expiresAt).getTime();
    // ينتهي بنهاية اليوم المذكور لا ببدايته.
    if (Number.isFinite(end) && now > end + 86_399_000) return 'انتهت صلاحية الكرت.';
  }
  return null;
}

/** إجمالي الأصناف التي يسري عليها الكرت. */
function eligibleSubtotal(coupon: Coupon, lines: CartLine[]): number {
  const restricted = coupon.productIds && coupon.productIds.length > 0;
  let sum = 0;
  for (const line of lines) {
    if (restricted && !coupon.productIds?.includes(line.productId)) continue;
    const product = catalog.getById(line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!variant) continue;
    sum += variant.price * line.quantity;
  }
  return sum;
}

/**
 * يفحص رمزًا على سلة بعينها ويحسب قيمة الخصم.
 * لا يغيّر شيئًا؛ التسجيل يتم عند إتمام الطلب وحده.
 */
export function checkCoupon(
  code: string,
  lines: CartLine[],
  subtotal: number,
  now: number = Date.now(),
): CouponCheck {
  const wanted = code.trim().toUpperCase();
  if (wanted.length === 0) return NO_DISCOUNT;

  const coupon = currentCoupons().find((c) => c.code === wanted);
  if (!coupon) return { ...NO_DISCOUNT, reason: 'رمز غير معروف.' };
  if (!coupon.active) return { ...NO_DISCOUNT, reason: 'الكرت موقوف.' };

  const dateProblem = withinDates(coupon, now);
  if (dateProblem) return { ...NO_DISCOUNT, reason: dateProblem };

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return { ...NO_DISCOUNT, reason: 'استُنفد عدد مرات استعمال الكرت.' };
  }

  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return { ...NO_DISCOUNT, reason: `الكرت يبدأ من ${coupon.minSubtotal} ج.م.` };
  }

  const base = eligibleSubtotal(coupon, lines);
  if (base <= 0) {
    return { ...NO_DISCOUNT, reason: 'الكرت لا يسري على أصناف السلة.' };
  }

  if (coupon.kind === 'shipping') {
    return { ok: true, coupon, discount: 0, freeShipping: true };
  }

  let discount =
    coupon.kind === 'percent' ? (base * coupon.value) / 100 : Math.min(coupon.value, base);

  if (coupon.maxDiscount && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  discount = Math.min(Math.round(discount * 100) / 100, base);
  if (discount <= 0) return { ...NO_DISCOUNT, reason: 'الكرت لا يعطي خصمًا على هذه السلة.' };

  return { ok: true, coupon, discount, freeShipping: false };
}

/** وصف الخصم بعبارة مختصرة، للعرض في السلة ولوحة الإدارة. */
export function describeCoupon(coupon: Coupon): string {
  switch (coupon.kind) {
    case 'percent':
      return `خصم ${coupon.value}%`;
    case 'fixed':
      return `خصم ${coupon.value} ج.م`;
    case 'shipping':
      return 'شحن مجاني';
    default:
      return '';
  }
}

/** رمز عشوائي صالح للاستعمال ككرت خصم. */
export function generateCouponCode(prefix = 'OPT'): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `${prefix}${body}`;
}
