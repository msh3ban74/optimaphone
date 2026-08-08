import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmptyState } from '../components/bits';
import {
  ACTIVE_PAYMENT_CHANNELS,
  RECEIPT_LIMITS,
  STORE,
  paymentChannel,
  type PaymentMethodId,
} from '../config/store';
import { catalog } from '../data/localCatalogRepository';
import type { Order, Recipient, TransferProof } from '../domain/entities';
import {
  useActiveOrderStore,
  useCartStore,
  useCartTotals,
  useOrdersStore,
} from '../store/stores';
import { formatPrice, orderNumber, secureId, variantLabel } from '../utils/format';
import {
  isValidEgyptianPhone,
  normalizeEgyptianPhone,
  parseAmount,
  sanitizeMultiline,
  sanitizeText,
  verifyReceiptFile,
} from '../utils/security';

const STEPS = ['المستلِم', 'السداد', 'المراجعة'] as const;

const RECEIPT_REJECTIONS: Record<string, string> = {
  type: 'الصيغ المقبولة: JPG أو PNG أو WEBP.',
  size: 'أقصى حجم للإيصال خمسة ميغابايت.',
  content: 'تعذّر قراءة الملف كصورة سليمة.',
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const totals = useCartTotals();
  const placeOrder = useOrdersStore((s) => s.place);
  const setActiveOrder = useActiveOrderStore((s) => s.setOrder);
  const setReceipt = useActiveOrderStore((s) => s.setReceipt);
  const receiptPreview = useActiveOrderStore((s) => s.receiptPreview);
  const receiptFile = useActiveOrderStore((s) => s.receiptFile);

  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<PaymentMethodId>(
    ACTIVE_PAYMENT_CHANNELS[0]?.id ?? 'cod',
  );
  const [senderNumber, setSenderNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const channel = paymentChannel(payment);
  const needsProof = channel?.requiresProof ?? false;

  const resolved = useMemo(
    () =>
      lines.flatMap((line) => {
        const product = catalog.getById(line.productId);
        const variant = product?.variants.find((v) => v.id === line.variantId);
        return product && variant ? [{ line, product, variant }] : [];
      }),
    [lines],
  );

  if (resolved.length === 0) {
    return (
      <div className="wrap">
        <EmptyState
          mark="⛊"
          title="لا يوجد طلب لإتمامه"
          body="السلة خالية في الوقت الحالي."
          action={
            <Link to="/shop" className="btn btn-gold">
              تصفّح المعروضات
            </Link>
          }
        />
      </div>
    );
  }

  const fail = (message: string): false => {
    setError(message);
    return false;
  };

  const validateRecipient = (): boolean => {
    if (sanitizeText(name, 80).length < 3) return fail('يُرجى إدخال الاسم الثلاثي.');
    if (!isValidEgyptianPhone(phone)) return fail('يُرجى إدخال رقم هاتف صحيح.');
    if (sanitizeText(city, 60).length < 2) return fail('يُرجى إدخال المدينة.');
    if (sanitizeMultiline(address, 240).length < 8) return fail('يُرجى إدخال العنوان بالتفصيل.');
    setError(null);
    return true;
  };

  const validatePayment = (): boolean => {
    if (!needsProof) {
      setError(null);
      return true;
    }
    if (!isValidEgyptianPhone(senderNumber)) {
      return fail('يُرجى إدخال الرقم الذي أُرسل منه التحويل.');
    }
    const parsed = parseAmount(amount);
    if (parsed === null) return fail('يُرجى إدخال قيمة التحويل.');
    if (!receiptFile) return fail('يُرجى إرفاق صورة الإيصال.');
    setError(null);
    return true;
  };

  const onPickReceipt = async (file: File | undefined) => {
    if (!file) return;
    const check = await verifyReceiptFile(file);
    if (!check.ok) {
      setReceipt(null);
      setReceiptError(RECEIPT_REJECTIONS[check.reason ?? 'content']);
      return;
    }
    setReceiptError(null);
    setReceipt(file);
  };

  const next = () => {
    if (step === 0 && !validateRecipient()) return;
    if (step === 1 && !validatePayment()) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    finalize();
  };

  const finalize = () => {
    const recipient: Recipient = {
      name: sanitizeText(name, 80),
      phone: normalizeEgyptianPhone(phone) ?? '',
      city: sanitizeText(city, 60),
      address: sanitizeMultiline(address, 240),
    };

    const proof: TransferProof | undefined = needsProof
      ? {
          senderNumber: normalizeEgyptianPhone(senderNumber) ?? '',
          amount: parseAmount(amount) ?? 0,
          receiptName: receiptFile?.name,
        }
      : undefined;

    const order: Order = {
      id: secureId('order'),
      number: orderNumber(),
      placedAt: new Date().toISOString(),
      lines: resolved.map(({ line, product, variant }) => ({
        productName: product.name,
        variantLabel: variantLabel([variant.color?.name, variant.storage, variant.ram]),
        unitPrice: variant.price,
        quantity: line.quantity,
      })),
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      total: totals.total,
      payment,
      recipient,
      proof,
    };

    setActiveOrder(order);
    placeOrder(order);
    clearCart();
    navigate('/confirmed', { replace: true });
  };

  return (
    <div className="wrap narrow section-tight">
      <h1 className="h1 center-text">إتمام الطلب</h1>

      <ol className="steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`step${i === step ? ' on' : ''}${i < step ? ' done' : ''}`}
          >
            <span className="step-dot">{i < step ? '✓' : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section className="rise">
          <div className="field">
            <label htmlFor="f-name">الاسم</label>
            <input
              id="f-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={80}
            />
          </div>
          <div className="field">
            <label htmlFor="f-phone">رقم الهاتف</label>
            <input
              id="f-phone"
              className="ltr end-text tnum"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
            />
          </div>
          <div className="field">
            <label htmlFor="f-city">المدينة</label>
            <input
              id="f-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              maxLength={60}
            />
          </div>
          <div className="field">
            <label htmlFor="f-address">العنوان</label>
            <textarea
              id="f-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              maxLength={240}
            />
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="rise">
          {ACTIVE_PAYMENT_CHANNELS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={payment === c.id ? 'choice on' : 'choice'}
              onClick={() => setPayment(c.id)}
              aria-pressed={payment === c.id}
            >
              <span className="radio">
                <i />
              </span>
              <span className="grow">
                <span className="h3">{c.label}</span>
                <br />
                <span className="faint">{c.note}</span>
              </span>
            </button>
          ))}

          {needsProof ? (
            <div className="transfer-box stack">
              <div className="transfer-target">
                <span className="small muted">التحويل إلى</span>
                <span className="transfer-number">{STORE.transferNumberLocal}</span>
              </div>

              <div className="field">
                <label htmlFor="f-sender">الرقم المُرسِل منه</label>
                <input
                  id="f-sender"
                  className="ltr end-text tnum"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  inputMode="tel"
                  maxLength={20}
                />
              </div>

              <div className="field">
                <label htmlFor="f-amount">قيمة التحويل</label>
                <input
                  id="f-amount"
                  className="tnum"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  maxLength={12}
                />
                <span className="field-note">المستحق {formatPrice(totals.total)}</span>
              </div>

              <div className="field">
                <span className="small muted">صورة الإيصال</span>
                <input
                  ref={fileRef}
                  aria-label="صورة الإيصال"
                  id="f-receipt"
                  className="file-input"
                  type="file"
                  accept={RECEIPT_LIMITS.acceptedTypes.join(',')}
                  onChange={(e) => void onPickReceipt(e.target.files?.[0])}
                />
                {receiptPreview ? (
                  <div className="stack-sm">
                    <div className="receipt-preview">
                      <img src={receiptPreview} alt="إيصال التحويل" />
                    </div>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => {
                        setReceipt(null);
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                    >
                      إزالة الإيصال
                    </button>
                  </div>
                ) : (
                  <label className="file-drop" htmlFor="f-receipt">
                    <span className="gold" aria-hidden="true">
                      ⊕
                    </span>
                    <span className="small">اختر صورة الإيصال</span>
                  </label>
                )}
                {receiptError ? <span className="field-bad">{receiptError}</span> : null}
                <span className="field-note">
                  تبقى الصورة على جهازك، ولا تُرفع إلى أي خادم.
                </span>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="rise stack">
          <dl className="panel">
            <div className="panel-row">
              <dt>المستلِم</dt>
              <dd>{sanitizeText(name, 80)}</dd>
            </div>
            <div className="panel-row">
              <dt>الهاتف</dt>
              <dd className="ltr tnum">{normalizeEgyptianPhone(phone)}</dd>
            </div>
            <div className="panel-row">
              <dt>العنوان</dt>
              <dd>
                {sanitizeText(city, 60)} — {sanitizeMultiline(address, 240)}
              </dd>
            </div>
            <div className="panel-row">
              <dt>السداد</dt>
              <dd>{channel?.label}</dd>
            </div>
            {needsProof ? (
              <div className="panel-row">
                <dt>قيمة التحويل</dt>
                <dd className="tnum">{formatPrice(parseAmount(amount) ?? 0)}</dd>
              </div>
            ) : null}
          </dl>

          <dl className="panel">
            {resolved.map(({ line, product, variant }) => (
              <div key={`${line.productId}-${line.variantId}`} className="panel-row">
                <dt>
                  {line.quantity} × {product.name}
                </dt>
                <dd className="tnum">{formatPrice(variant.price * line.quantity)}</dd>
              </div>
            ))}
            <div className="panel-row">
              <dt className="strong">الإجمالي</dt>
              <dd className="tnum">{formatPrice(totals.total)}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {error ? <p className="field-bad center-text">{error}</p> : null}

      <div className="row-between wrap-flex">
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => (step === 0 ? navigate('/cart') : setStep(step - 1))}
        >
          رجوع
        </button>

        <div className="end-text">
          <p className="faint">الإجمالي</p>
          <p className="h2 tnum">{formatPrice(totals.total)}</p>
        </div>

        <button type="button" className="btn btn-gold" onClick={next}>
          {step === STEPS.length - 1 ? 'تأكيد الطلب' : 'متابعة'}
        </button>
      </div>
    </div>
  );
}
