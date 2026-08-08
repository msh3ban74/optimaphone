import { useState } from 'react';

import { useToastStore } from '../components/bits';
import { formatPrice } from '../utils/format';
import {
  isValidEgyptianPhone,
  parseAmount,
  sanitizeText,
} from '../utils/security';
import {
  buildOrderConfirmedMessage,
  buildTransferConfirmedMessage,
  customerWhatsappLink,
} from '../utils/whatsapp';

type Kind = 'transfer' | 'order';

/**
 * أداة التاجر لإنشاء رسائل التأكيد. لا تحفظ هذه الصفحة أي بيان،
 * ولا تقرأ بيانات العملاء؛ إنما تصوغ نصًا وتفتح به الواتساب.
 */
export function MerchantPage() {
  const notify = useToastStore((s) => s.show);

  const [kind, setKind] = useState<Kind>('transfer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const compose = (): string | null => {
    const trimmedRef = sanitizeText(reference, 24);
    if (trimmedRef.length < 3) {
      setError('يُرجى إدخال رقم الطلب.');
      return null;
    }
    if (kind === 'transfer') {
      const parsed = parseAmount(amount);
      if (parsed === null) {
        setError('يُرجى إدخال المبلغ المستلَم.');
        return null;
      }
      setError(null);
      return buildTransferConfirmedMessage({
        customerName: customerName || undefined,
        orderNumber: trimmedRef,
        amount: parsed,
      });
    }
    setError(null);
    return buildOrderConfirmedMessage({
      customerName: customerName || undefined,
      orderNumber: trimmedRef,
    });
  };

  const send = () => {
    if (!isValidEgyptianPhone(customerPhone)) {
      setError('يُرجى إدخال رقم العميل.');
      return;
    }
    const message = compose();
    if (!message) return;
    const link = customerWhatsappLink(customerPhone, message);
    if (!link) {
      setError('يُرجى إدخال رقم العميل.');
      return;
    }
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const copy = async () => {
    const message = compose();
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      notify('نُسخت الرسالة');
    } catch {
      setError('تعذّر النسخ في هذا المتصفح.');
    }
  };

  const parsedAmount = parseAmount(amount);

  return (
    <div className="wrap narrow-sm section-tight stack">
      <div>
        <p className="eyebrow">أوبتيما فون</p>
        <h1 className="h1">رسائل التأكيد</h1>
        <hr className="gold-rule" />
        <p className="faint">لا تُحفظ أي بيانات في هذه الصفحة.</p>
      </div>

      <div className="chips">
        <button
          type="button"
          className={kind === 'transfer' ? 'chip on' : 'chip'}
          onClick={() => setKind('transfer')}
        >
          استلام تحويل
        </button>
        <button
          type="button"
          className={kind === 'order' ? 'chip on' : 'chip'}
          onClick={() => setKind('order')}
        >
          اعتماد طلب
        </button>
      </div>

      <div>
        <div className="field">
          <label htmlFor="m-phone">رقم العميل</label>
          <input
            id="m-phone"
            className="ltr end-text tnum"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            inputMode="tel"
            maxLength={20}
          />
        </div>

        <div className="field">
          <label htmlFor="m-name">اسم العميل</label>
          <input
            id="m-name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            maxLength={60}
          />
        </div>

        <div className="field">
          <label htmlFor="m-ref">رقم الطلب</label>
          <input
            id="m-ref"
            className="ltr end-text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            maxLength={24}
          />
        </div>

        {kind === 'transfer' ? (
          <div className="field">
            <label htmlFor="m-amount">المبلغ المستلَم</label>
            <input
              id="m-amount"
              className="tnum"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              maxLength={12}
            />
            {parsedAmount !== null ? (
              <span className="field-note">{formatPrice(parsedAmount)}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? <p className="field-bad">{error}</p> : null}

      <div className="row wrap-flex">
        <button type="button" className="btn btn-whatsapp grow" onClick={send}>
          إرسال عبر واتساب
        </button>
        <button type="button" className="btn btn-quiet grow" onClick={() => void copy()}>
          نسخ النص
        </button>
      </div>
    </div>
  );
}
