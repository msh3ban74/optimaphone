import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useToastStore } from '../components/bits';
import { useStoreData } from '../data/storeData';
import {
  ORDER_STATUSES,
  orderStatusLabel,
  type AdminOrder,
  type OrderStatus,
} from '../domain/admin';
import type { PaymentMethodId } from '../config/store';
import { formatDate, formatPrice, orderNumber, secureId } from '../utils/format';
import { customerWhatsappLink } from '../utils/whatsapp';
import {
  buildOrderConfirmedMessage,
  buildTransferConfirmedMessage,
} from '../utils/whatsapp';
import { isValidEgyptianPhone, normalizeEgyptianPhone, sanitizeText } from '../utils/security';
import { statusTone } from './DashboardView';
import { Invoice } from './Invoice';

/* ── قائمة الطلبات ───────────────────────────────────────────── */

export function OrdersView() {
  const orders = useStoreData((s) => s.orders);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const term = text.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (!term) return true;
      return (
        o.number.toLowerCase().includes(term) ||
        o.recipient.name.toLowerCase().includes(term) ||
        o.recipient.phone.includes(term)
      );
    });
  }, [orders, filter, text]);

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <div>
          <h1 className="h2">الطلبات</h1>
          <p className="small muted">
            طلبات الموقع تُسجَّل تلقائيًا على الجهاز الذي طُلبت منه. ما يصلك على
            الواتساب سجّله هنا يدويًا.
          </p>
        </div>
        <button type="button" className="btn btn-gold" onClick={() => setAdding((v) => !v)}>
          {adding ? 'إغلاق' : 'تسجيل طلب'}
        </button>
      </div>

      {adding ? <ManualOrderForm onDone={() => setAdding(false)} /> : null}

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="ابحث برقم الطلب أو اسم العميل أو هاتفه"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="بحث في الطلبات"
        />
        <div className="admin-chips">
          <button
            type="button"
            className={filter === 'all' ? 'chip on' : 'chip'}
            onClick={() => setFilter('all')}
          >
            الكل
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={filter === s.id ? 'chip on' : 'chip'}
              onClick={() => setFilter(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="admin-panel center-text">
          <p className="muted small">
            {orders.length === 0 ? 'لا طلبات بعد.' : 'لا طلبات تطابق البحث.'}
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>الرقم</th>
                <th>التاريخ</th>
                <th>العميل</th>
                <th>الأصناف</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="tnum">
                    <Link to={`/admin/orders/${o.id}`} className="strong">
                      {o.number}
                    </Link>
                  </td>
                  <td className="small">{formatDate(o.placedAt)}</td>
                  <td>
                    {o.recipient.name}
                    <div className="faint small ltr">{o.recipient.phone}</div>
                  </td>
                  <td className="tnum">{o.lines.reduce((s, l) => s + l.quantity, 0)}</td>
                  <td className="tnum">{formatPrice(o.total)}</td>
                  <td>
                    <span className={`pill tone-${statusTone(o.status)}`}>
                      {orderStatusLabel(o.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── تفاصيل الطلب ────────────────────────────────────────────── */

export function OrderDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToastStore((s) => s.show);

  const order = useStoreData((s) => s.orders.find((o) => o.id === id));
  const setStatus = useStoreData((s) => s.setOrderStatus);
  const setNote = useStoreData((s) => s.setOrderNote);
  const removeOrder = useStoreData((s) => s.removeOrder);

  const [confirming, setConfirming] = useState(false);
  const [invoicing, setInvoicing] = useState(false);

  if (!order) {
    return (
      <div className="admin-panel center-text stack-sm">
        <p className="h3">لم يُعثر على الطلب</p>
        <button type="button" className="btn btn-quiet" onClick={() => navigate('/admin/orders')}>
          رجوع إلى الطلبات
        </button>
      </div>
    );
  }

  const notifyCustomer = (kind: 'order' | 'transfer') => {
    const message =
      kind === 'order'
        ? buildOrderConfirmedMessage({
            customerName: order.recipient.name,
            orderNumber: order.number,
          })
        : buildTransferConfirmedMessage({
            customerName: order.recipient.name,
            orderNumber: order.number,
            amount: order.total,
          });

    const link = customerWhatsappLink(order.recipient.phone, message);
    if (!link) {
      notify('رقم العميل غير صالح');
      return;
    }
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  if (invoicing) return <Invoice order={order} onClose={() => setInvoicing(false)} />;

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <div>
          <h1 className="h2 tnum">{order.number}</h1>
          <p className="small muted">
            {formatDate(order.placedAt)} ·{' '}
            {order.source === 'manual' ? 'سُجّل يدويًا' : 'من الموقع'}
          </p>
        </div>
        <div className="admin-row-actions">
          <button type="button" className="btn btn-quiet" onClick={() => setInvoicing(true)}>
            فاتورة
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => navigate('/admin/orders')}>
            رجوع
          </button>
        </div>
      </div>

      <section className="admin-panel stack-sm">
        <h2 className="h3">الحالة</h2>
        <div className="admin-chips">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={order.status === s.id ? 'chip on' : 'chip'}
              onClick={() => {
                setStatus(order.id, s.id);
                notify(`الحالة الآن: ${s.label}`);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <div className="admin-split">
        <section className="admin-panel stack-sm">
          <h2 className="h3">المستلِم</h2>
          <dl className="panel">
            <div className="panel-row">
              <dt>الاسم</dt>
              <dd>{order.recipient.name}</dd>
            </div>
            <div className="panel-row">
              <dt>الهاتف</dt>
              <dd className="ltr tnum">{order.recipient.phone}</dd>
            </div>
            <div className="panel-row">
              <dt>المدينة</dt>
              <dd>{order.recipient.city}</dd>
            </div>
            <div className="panel-row">
              <dt>العنوان</dt>
              <dd>{order.recipient.address}</dd>
            </div>
          </dl>

          <div className="admin-row-actions">
            <button type="button" className="btn btn-quiet" onClick={() => notifyCustomer('order')}>
              تأكيد الطلب بواتساب
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => notifyCustomer('transfer')}
            >
              تأكيد الاستلام
            </button>
          </div>
        </section>

        <section className="admin-panel stack-sm">
          <h2 className="h3">الأصناف</h2>
          <dl className="panel">
            {order.lines.map((l, i) => (
              <div key={i} className="panel-row">
                <dt>
                  {l.quantity} × {l.productName}
                  {l.variantLabel ? <span className="faint small"> {l.variantLabel}</span> : null}
                </dt>
                <dd className="tnum">{formatPrice(l.unitPrice * l.quantity)}</dd>
              </div>
            ))}
            <div className="panel-row">
              <dt>الأصناف</dt>
              <dd className="tnum">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 ? (
              <div className="panel-row">
                <dt>
                  الخصم {order.couponCode ? <span className="ltr faint">{order.couponCode}</span> : null}
                </dt>
                <dd className="tnum">− {formatPrice(order.discount)}</dd>
              </div>
            ) : null}
            <div className="panel-row">
              <dt>الشحن</dt>
              <dd className="tnum">
                {order.shipping === 0 ? 'مجاني' : formatPrice(order.shipping)}
              </dd>
            </div>
            <div className="panel-row">
              <dt className="strong">الإجمالي</dt>
              <dd className="tnum strong">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="admin-panel stack-sm">
        <h2 className="h3">ملاحظة داخلية</h2>
        <textarea
          value={order.note ?? ''}
          onChange={(e) => setNote(order.id, e.target.value)}
          maxLength={400}
          rows={3}
          aria-label="ملاحظة داخلية"
          placeholder="لا يراها العميل."
        />
      </section>

      <section className="admin-panel">
        {confirming ? (
          <div className="admin-row-actions">
            <button
              type="button"
              className="btn btn-quiet danger"
              onClick={() => {
                removeOrder(order.id);
                notify('حُذف الطلب');
                navigate('/admin/orders');
              }}
            >
              تأكيد الحذف نهائيًا
            </button>
            <button type="button" className="text-btn" onClick={() => setConfirming(false)}>
              تراجع
            </button>
          </div>
        ) : (
          <button type="button" className="text-btn danger" onClick={() => setConfirming(true)}>
            حذف الطلب
          </button>
        )}
      </section>
    </div>
  );
}

/* ── تسجيل طلب يدويًا ────────────────────────────────────────── */

interface ManualLine {
  productName: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
}

function ManualOrderForm({ onDone }: { onDone: () => void }) {
  const products = useStoreData((s) => s.products);
  const addOrder = useStoreData((s) => s.addOrder);
  const adjustStock = useStoreData((s) => s.adjustStock);
  const settings = useStoreData((s) => s.settings);
  const notify = useToastStore((s) => s.show);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<PaymentMethodId>('cod');
  const [lines, setLines] = useState<ManualLine[]>([]);
  const [pick, setPick] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deductStock, setDeductStock] = useState(true);

  /** كل خيارات كل الأصناف، مسطَّحة في قائمة اختيار واحدة. */
  const options = useMemo(
    () =>
      products.flatMap((p) =>
        p.variants.map((v) => ({
          key: `${p.id}|${v.id}`,
          productId: p.id,
          variantId: v.id,
          label: `${p.name} — ${[v.color?.name, v.storage, v.ram].filter(Boolean).join(' · ') || 'أساسي'}`,
          price: v.price,
          stock: v.stock,
        })),
      ),
    [products],
  );

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const shipping =
    subtotal === 0 ||
    (settings.freeShippingOver !== null && subtotal >= settings.freeShippingOver)
      ? 0
      : settings.shippingFee;
  const total = Math.max(0, subtotal - discount) + shipping;

  const addLine = () => {
    const option = options.find((o) => o.key === pick);
    if (!option) return;
    setLines((ls) => [
      ...ls,
      {
        productName: products.find((p) => p.id === option.productId)?.name ?? '',
        variantLabel: option.label.split('—')[1]?.trim() ?? '',
        unitPrice: option.price,
        quantity: 1,
      },
    ]);
    setPick('');
  };

  const submit = () => {
    if (sanitizeText(name, 80).length < 3) {
      setError('يُرجى إدخال اسم العميل.');
      return;
    }
    if (!isValidEgyptianPhone(phone)) {
      setError('يُرجى إدخال رقم هاتف صحيح.');
      return;
    }
    if (lines.length === 0) {
      setError('أضف صنفًا واحدًا على الأقل.');
      return;
    }

    const order: AdminOrder = {
      id: secureId('order'),
      number: orderNumber(),
      placedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'new',
      lines,
      subtotal,
      discount,
      shipping,
      total,
      payment,
      recipient: {
        name: sanitizeText(name, 80),
        phone: normalizeEgyptianPhone(phone) ?? '',
        city: sanitizeText(city, 60),
        address: sanitizeText(address, 240),
      },
      source: 'manual',
    };

    addOrder(order);

    if (deductStock) {
      for (const line of lines) {
        const option = options.find(
          (o) => products.find((p) => p.id === o.productId)?.name === line.productName,
        );
        if (option) adjustStock(option.productId, option.variantId, -line.quantity);
      }
    }

    notify('سُجّل الطلب');
    onDone();
  };

  return (
    <section className="admin-panel stack-sm">
      <h2 className="h3">تسجيل طلب</h2>

      <div className="admin-grid-2">
        <div className="field">
          <label htmlFor="m-name">اسم العميل</label>
          <input id="m-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="m-phone">الهاتف</label>
          <input
            id="m-phone"
            className="ltr end-text tnum"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            maxLength={20}
          />
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="field">
          <label htmlFor="m-city">المدينة</label>
          <input id="m-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="m-payment">السداد</label>
          <select
            id="m-payment"
            value={payment}
            onChange={(e) => setPayment(e.target.value as PaymentMethodId)}
          >
            <option value="cod">الدفع عند الاستلام</option>
            <option value="instapay">إنستاباي</option>
            <option value="wallet">محفظة إلكترونية</option>
            <option value="cash">نقدًا في المعرض</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="m-address">العنوان</label>
        <input
          id="m-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          maxLength={240}
        />
      </div>

      <div className="field">
        <label htmlFor="m-pick">إضافة صنف</label>
        <div className="admin-inline-row">
          <select id="m-pick" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">اختر صنفًا…</option>
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label} — {formatPrice(o.price)} (متوفر {o.stock})
              </option>
            ))}
          </select>
          <button type="button" className="text-btn" onClick={addLine} disabled={!pick}>
            إضافة
          </button>
        </div>
        {options.length === 0 ? (
          <span className="field-note">أضف أصنافًا أولًا من صفحة الأصناف.</span>
        ) : null}
      </div>

      {lines.map((l, i) => (
        <div key={i} className="admin-inline-row">
          <span className="grow small">
            {l.productName} <span className="faint">{l.variantLabel}</span>
          </span>
          <input
            className="tnum qty-input"
            type="number"
            min={1}
            value={l.quantity}
            onChange={(e) =>
              setLines((ls) =>
                ls.map((x, j) =>
                  j === i ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x,
                ),
              )
            }
            aria-label="الكمية"
          />
          <span className="tnum small">{formatPrice(l.unitPrice * l.quantity)}</span>
          <button
            type="button"
            className="text-btn danger"
            onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
          >
            حذف
          </button>
        </div>
      ))}

      <div className="admin-grid-2">
        <div className="field">
          <label htmlFor="m-discount">خصم</label>
          <input
            id="m-discount"
            className="tnum"
            type="number"
            min={0}
            value={discount || ''}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
          />
        </div>
        <div className="field">
          <span className="small muted">خصم الكمية من المخزون</span>
          <button
            type="button"
            className={deductStock ? 'toggle on' : 'toggle'}
            onClick={() => setDeductStock((v) => !v)}
            aria-pressed={deductStock}
          >
            <i />
          </button>
        </div>
      </div>

      <dl className="panel">
        <div className="panel-row">
          <dt>الأصناف</dt>
          <dd className="tnum">{formatPrice(subtotal)}</dd>
        </div>
        <div className="panel-row">
          <dt>الشحن</dt>
          <dd className="tnum">{shipping === 0 ? 'مجاني' : formatPrice(shipping)}</dd>
        </div>
        <div className="panel-row">
          <dt className="strong">الإجمالي</dt>
          <dd className="tnum strong">{formatPrice(total)}</dd>
        </div>
      </dl>

      {error ? <p className="field-bad">{error}</p> : null}

      <div className="admin-row-actions">
        <button type="button" className="btn btn-quiet" onClick={onDone}>
          إلغاء
        </button>
        <button type="button" className="btn btn-gold" onClick={submit}>
          حفظ الطلب
        </button>
      </div>
    </section>
  );
}
