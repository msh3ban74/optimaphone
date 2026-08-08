import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { catalog } from '../data/localCatalogRepository';
import { Address, Order, PaymentMethodKind } from '../domain/entities';
import { computeCart, useCartStore, useOrdersStore } from '../store/stores';
import { deliveryEstimate, formatPrice, makeId, orderNumber } from '../utils/format';

const STEPS = ['العنوان', 'التوصيل', 'الدفع', 'المراجعة'];

const PAYMENT_METHODS: Array<{ kind: PaymentMethodKind; title: string; subtitle: string; icon: string }> = [
  { kind: 'apple-pay', title: 'Apple Pay', subtitle: 'دفع فوري وآمن بالبصمة', icon: '' },
  { kind: 'google-pay', title: 'Google Pay', subtitle: 'إتمام الشراء بلمسة واحدة', icon: 'G' },
  { kind: 'card', title: 'بطاقة بنكية', subtitle: 'Visa · Mastercard · Mada', icon: '💳' },
  { kind: 'cod', title: 'الدفع عند الاستلام', subtitle: 'ادفع كاش عند وصول الطلب', icon: '💵' },
];

const DELIVERY_OPTIONS = [
  { id: 'express', title: 'توصيل سريع', subtitle: deliveryEstimate(1, 2), price: 19 },
  { id: 'standard', title: 'توصيل عادي', subtitle: deliveryEstimate(2, 4), price: 0 },
  { id: 'pickup', title: 'استلام من الفرع', subtitle: 'جاهز اليوم من فرع أوبتيما فون', price: 0 },
] as const;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, coupon, clear } = useCartStore();
  const placeOrder = useOrdersStore((s) => s.place);

  const [step, setStep] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [delivery, setDelivery] = useState<(typeof DELIVERY_OPTIONS)[number]['id']>('standard');
  const [payment, setPayment] = useState<PaymentMethodKind>('card');
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => computeCart(lines, coupon), [lines, coupon]);
  const deliveryOption = DELIVERY_OPTIONS.find((d) => d.id === delivery)!;
  const grandTotal = totals.total + deliveryOption.price;

  if (lines.length === 0) {
    return (
      <div className="container empty">
        <div className="icon">🛍️</div>
        <h2>لا يوجد طلب لإتمامه</h2>
        <p>سلتك فاضية حاليًا.</p>
        <Link to="/shop" className="btn btn-gold">
          تسوّق الآن
        </Link>
      </div>
    );
  }

  const validateAddress = (): boolean => {
    if (recipient.trim().length < 2) return fail('من فضلك اكتب الاسم الكامل.');
    if (!/^[+\d][\d\s-]{6,}$/.test(phone.trim())) return fail('من فضلك اكتب رقم هاتف صحيح.');
    if (line1.trim().length < 5) return fail('من فضلك اكتب العنوان بالتفصيل.');
    if (city.trim().length < 2) return fail('من فضلك اكتب المدينة.');
    setError(null);
    return true;
  };

  const fail = (message: string): false => {
    setError(message);
    return false;
  };

  const next = () => {
    if (step === 0 && !validateAddress()) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else finalize();
  };

  const finalize = () => {
    const address: Address = {
      id: makeId('addr'),
      label: 'عنوان الشحن',
      recipient: recipient.trim(),
      line1: line1.trim(),
      city: city.trim(),
      phone: phone.trim(),
    };

    const orderLines = lines.flatMap((line) => {
      const product = catalog.getById(line.productId);
      const variant = product?.variants.find((v) => v.id === line.variantId);
      if (!product || !variant) return [];
      const dealActive =
        product.flashDeal && new Date(product.flashDeal.endsAt).getTime() > Date.now();
      const unit = dealActive
        ? variant.price * (1 - product.flashDeal!.percentOff / 100)
        : variant.price;
      return [
        {
          productId: product.id,
          productName: product.name,
          variantLabel: [variant.color.name, variant.storage, variant.ram]
            .filter(Boolean)
            .join(' · '),
          image: product.images[0],
          unitPrice: unit,
          quantity: line.quantity,
        },
      ];
    });

    const order: Order = {
      id: makeId('order'),
      number: orderNumber(),
      placedAt: new Date().toISOString(),
      status: 'placed',
      lines: orderLines,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping + deliveryOption.price,
      total: grandTotal,
      address,
      payment,
      couponCode: coupon?.code,
    };

    placeOrder(order);
    clear();
    navigate(`/success/${order.id}`, { replace: true });
  };

  return (
    <div className="container" style={{ maxWidth: 720, paddingBlock: '2rem' }}>
      <h1 className="section-title" style={{ textAlign: 'center' }}>
        إتمام الطلب
      </h1>

      <div className="steps">
        {STEPS.map((label, i) => (
          <div key={label} className={`step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
            <div className="dot">{i < step ? '✓' : i + 1}</div>
            {label}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div style={{ animation: 'rise 0.4s' }}>
          <div className="field">
            <label htmlFor="f-name">الاسم الكامل</label>
            <input id="f-name" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="محمد شعبان" />
          </div>
          <div className="field">
            <label htmlFor="f-phone">رقم الهاتف</label>
            <input id="f-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 100 123 4567" style={{ direction: 'ltr', textAlign: 'end' }} />
          </div>
          <div className="field">
            <label htmlFor="f-addr">العنوان</label>
            <input id="f-addr" value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="١٢ شارع التحرير، الدور الثالث" />
          </div>
          <div className="field">
            <label htmlFor="f-city">المدينة</label>
            <input id="f-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="القاهرة" />
          </div>
          {error ? <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p> : null}
        </div>
      ) : null}

      {step === 1 ? (
        <div style={{ animation: 'rise 0.4s' }}>
          {DELIVERY_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`option${delivery === option.id ? ' selected' : ''}`}
              onClick={() => setDelivery(option.id)}
              role="radio"
              aria-checked={delivery === option.id}
            >
              <span className="radio">
                <i />
              </span>
              <div style={{ flex: 1 }}>
                <strong>{option.title}</strong>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', direction: option.id === 'pickup' ? undefined : 'ltr', textAlign: 'start' }}>
                  {option.subtitle}
                </p>
              </div>
              <strong>{option.price === 0 ? 'مجاني' : formatPrice(option.price)}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div style={{ animation: 'rise 0.4s' }}>
          {PAYMENT_METHODS.map((method) => (
            <div
              key={method.kind}
              className={`option${payment === method.kind ? ' selected' : ''}`}
              onClick={() => setPayment(method.kind)}
              role="radio"
              aria-checked={payment === method.kind}
            >
              <span className="radio">
                <i />
              </span>
              <div style={{ flex: 1 }}>
                <strong>
                  {method.icon} {method.title}
                </strong>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>{method.subtitle}</p>
              </div>
            </div>
          ))}
          <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem', marginTop: '0.6rem' }}>
            🔒 المدفوعات تتم عبر بوابة دفع آمنة ومتوافقة مع معايير PCI-DSS — بيانات بطاقتك لا
            تمر على خوادمنا أبدًا.
          </p>
        </div>
      ) : null}

      {step === 3 ? (
        <div style={{ animation: 'rise 0.4s', display: 'grid', gap: '0.6rem' }}>
          <div className="info-card">
            <div className="info-row">
              <span className="k">الاستلام باسم</span>
              <span className="v">{recipient}</span>
            </div>
            <div className="info-row">
              <span className="k">العنوان</span>
              <span className="v">
                {line1}، {city}
              </span>
            </div>
            <div className="info-row">
              <span className="k">التوصيل</span>
              <span className="v">{deliveryOption.title}</span>
            </div>
            <div className="info-row">
              <span className="k">الدفع</span>
              <span className="v">{PAYMENT_METHODS.find((m) => m.kind === payment)?.title}</span>
            </div>
          </div>
          <div className="info-card">
            {lines.map((line) => {
              const product = catalog.getById(line.productId);
              return product ? (
                <div key={`${line.productId}-${line.variantId}`} className="info-row">
                  <span className="k">
                    {line.quantity}× {product.name}
                  </span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.6rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={() => (step === 0 ? navigate('/cart') : setStep(step - 1))}
        >
          → رجوع
        </button>
        <div style={{ textAlign: 'end' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>الإجمالي شامل التوصيل</p>
          <strong style={{ fontSize: '1.3rem' }}>{formatPrice(grandTotal)}</strong>
        </div>
        <button className="btn btn-gold" onClick={next}>
          {step === STEPS.length - 1 ? `تأكيد الطلب · ${formatPrice(grandTotal)}` : 'متابعة'}
        </button>
      </div>
    </div>
  );
}
