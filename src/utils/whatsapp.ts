import { STORE, paymentChannel } from '../config/store';
import type { Order, PaymentMethodId, Recipient, TransferProof } from '../domain/entities';
import { formatDate, formatPrice, variantLabel } from './format';
import { sanitizeText, toInternational } from './security';

/**
 * ── رسائل الواتساب ───────────────────────────────────────────
 *
 * تُصاغ الرسائل بالعربية الفصحى. تُبنى من بيانات مُطهَّرة فحسب،
 * ولا تُرسل إلا بفعل صريح من المستخدم عبر رابط الواتساب.
 */

const RULE = '━━━━━━━━━━━━━━━';

function line(label: string, value: string): string {
  return `${label}: ${value}`;
}

/** الرسالة التي يرسلها العميل إلى المتجر عند تأكيد الطلب. */
export function buildOrderMessage(order: Order): string {
  const channel = paymentChannel(order.payment);
  const parts: string[] = [];

  parts.push('السلام عليكم ورحمة الله وبركاته');
  parts.push('');
  parts.push(`طلب جديد من متجر «${STORE.name}»`);
  parts.push(RULE);
  parts.push(line('رقم الطلب', order.number));
  parts.push(line('التاريخ', formatDate(order.placedAt)));
  parts.push('');

  parts.push('الأصناف');
  for (const item of order.lines) {
    const detail = item.variantLabel ? ` (${item.variantLabel})` : '';
    parts.push(
      `• ${item.quantity} × ${item.productName}${detail} — ${formatPrice(
        item.unitPrice * item.quantity,
      )}`,
    );
  }
  parts.push('');

  parts.push(line('إجمالي الأصناف', formatPrice(order.subtotal)));
  parts.push(
    line('الشحن', order.shipping === 0 ? 'مشمول' : formatPrice(order.shipping)),
  );
  parts.push(line('الإجمالي المستحق', formatPrice(order.total)));
  parts.push('');

  parts.push('بيانات المستلِم');
  parts.push(line('الاسم', order.recipient.name));
  parts.push(line('الهاتف', order.recipient.phone));
  parts.push(line('المدينة', order.recipient.city));
  parts.push(line('العنوان', order.recipient.address));
  parts.push('');

  parts.push('طريقة السداد');
  parts.push(channel ? channel.label : '—');

  if (order.proof) {
    parts.push(line('الرقم المُرسِل منه', order.proof.senderNumber));
    parts.push(line('قيمة التحويل', formatPrice(order.proof.amount)));
    parts.push(line('المحوَّل إليه', STORE.transferNumberLocal));
    parts.push('');
    parts.push('صورة الإيصال مرفقة مع هذه الرسالة.');
  }

  parts.push('');
  parts.push('وتفضلوا بقبول وافر التقدير.');

  return parts.join('\n');
}

/** الرسالة التي يرسلها المتجر إلى العميل بعد التحقق من التحويل. */
export function buildTransferConfirmedMessage(params: {
  customerName?: string;
  orderNumber: string;
  amount: number;
}): string {
  const name = params.customerName ? sanitizeText(params.customerName, 60) : '';
  const greeting = name ? `أستاذ/ ${name}، حيّاكم الله` : 'حيّاكم الله';

  return [
    greeting,
    '',
    `نفيدكم بأنه قد تم استلام حوالتكم المالية والتحقق منها لدى «${STORE.name}».`,
    RULE,
    line('رقم الطلب', sanitizeText(params.orderNumber, 24)),
    line('المبلغ المستلَم', formatPrice(params.amount)),
    '',
    'طلبكم الآن قيد التجهيز، وسيصلكم إشعار فور شحنه.',
    '',
    'شاكرين لكم حسن ثقتكم.',
  ].join('\n');
}

/** الرسالة التي يرسلها المتجر عند تأكيد الطلب وشحنه. */
export function buildOrderConfirmedMessage(params: {
  customerName?: string;
  orderNumber: string;
}): string {
  const name = params.customerName ? sanitizeText(params.customerName, 60) : '';
  const greeting = name ? `أستاذ/ ${name}، حيّاكم الله` : 'حيّاكم الله';

  return [
    greeting,
    '',
    `نؤكد لكم اعتماد طلبكم لدى «${STORE.name}» وبدء تجهيزه.`,
    RULE,
    line('رقم الطلب', sanitizeText(params.orderNumber, 24)),
    '',
    'سنوافيكم ببيانات الشحن فور خروج الطلب.',
    '',
    'شاكرين لكم حسن ثقتكم.',
  ].join('\n');
}

/** يبني رابط محادثة واتساب مع نص مُرمَّز ترميزًا سليمًا. */
export function whatsappLink(internationalNumber: string, message: string): string {
  const digits = internationalNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** رابط مراسلة المتجر. */
export function storeWhatsappLink(message: string): string {
  return whatsappLink(STORE.whatsapp, message);
}

/** رابط مراسلة عميل برقمه المحلي؛ يعيد null إن كان الرقم غير صالح. */
export function customerWhatsappLink(localPhone: string, message: string): string | null {
  const international = toInternational(localPhone);
  return international ? whatsappLink(international, message) : null;
}

/** يجمع بيانات الطلب اللازمة لبناء الرسالة. */
export function composeOrderSummary(
  recipient: Recipient,
  payment: PaymentMethodId,
  proof: TransferProof | undefined,
  lines: Array<{ name: string; parts: Array<string | undefined>; unitPrice: number; quantity: number }>,
): Pick<Order, 'lines'> & { recipient: Recipient; payment: PaymentMethodId; proof?: TransferProof } {
  return {
    recipient,
    payment,
    proof,
    lines: lines.map((l) => ({
      productName: l.name,
      variantLabel: variantLabel(l.parts),
      unitPrice: l.unitPrice,
      quantity: l.quantity,
    })),
  };
}
