import { useStoreData } from '../data/storeData';
import type { AdminOrder } from '../domain/admin';
import { orderStatusLabel } from '../domain/admin';
import { formatDate, formatPrice } from '../utils/format';

/**
 * فاتورة تُطبع أو تُحفظ PDF من حوار الطباعة نفسه.
 * تُخفى منها عناصر اللوحة كلها عبر قواعد @media print.
 */
export function Invoice({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const settings = useStoreData((s) => s.settings);

  return (
    <div className="invoice-overlay">
      <div className="invoice-actions no-print">
        <button type="button" className="btn btn-gold" onClick={() => window.print()}>
          طباعة أو حفظ PDF
        </button>
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          إغلاق
        </button>
      </div>

      <article className="invoice" dir="rtl">
        <header className="invoice-head">
          <div>
            <p className="invoice-brand">{settings.name}</p>
            <p className="invoice-sub">{settings.tagline}</p>
          </div>
          <div className="invoice-meta">
            <p className="invoice-number">فاتورة {order.number}</p>
            <p>{formatDate(order.placedAt)}</p>
            <p>{orderStatusLabel(order.status)}</p>
          </div>
        </header>

        <section className="invoice-parties">
          <div>
            <h3>المستلِم</h3>
            <p className="strong">{order.recipient.name}</p>
            <p className="ltr">{order.recipient.phone}</p>
            <p>
              {order.recipient.city}
              {order.recipient.address ? ` — ${order.recipient.address}` : ''}
            </p>
          </div>
          <div>
            <h3>التاجر</h3>
            <p className="strong">{settings.name}</p>
            <p className="ltr">{settings.transferNumberLocal}</p>
          </div>
        </section>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>سعر الوحدة</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line, i) => (
              <tr key={i}>
                <td>
                  {line.productName}
                  {line.variantLabel ? <div className="faint">{line.variantLabel}</div> : null}
                </td>
                <td className="tnum">{line.quantity}</td>
                <td className="tnum">{formatPrice(line.unitPrice)}</td>
                <td className="tnum">{formatPrice(line.unitPrice * line.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="invoice-totals">
          <div>
            <span>قيمة الأصناف</span>
            <span className="tnum">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 ? (
            <div>
              <span>الخصم {order.couponCode ? `(${order.couponCode})` : ''}</span>
              <span className="tnum">− {formatPrice(order.discount)}</span>
            </div>
          ) : null}
          <div>
            <span>الشحن</span>
            <span className="tnum">
              {order.shipping === 0 ? 'مجاني' : formatPrice(order.shipping)}
            </span>
          </div>
          <div className="invoice-grand">
            <span>الإجمالي</span>
            <span className="tnum">{formatPrice(order.total)}</span>
          </div>
        </section>

        <footer className="invoice-foot">
          <p>شكرًا لثقتك بنا.</p>
          <p className="faint">
            للاستفسار: {settings.transferNumberLocal} — {settings.name}
          </p>
        </footer>
      </article>
    </div>
  );
}
