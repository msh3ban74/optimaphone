import { Link, useParams } from 'react-router-dom';

import { useOrdersStore } from '../store/stores';
import { formatPrice } from '../utils/format';

export function SuccessPage() {
  const { id } = useParams<{ id: string }>();
  const order = useOrdersStore((s) => s.orders.find((o) => o.id === id));

  return (
    <div className="container" style={{ maxWidth: 620, paddingBlock: '3.5rem', textAlign: 'center' }}>
      <div className="success-ring">✓</div>
      <h1 className="section-title" style={{ marginTop: '1.4rem' }}>
        تم تأكيد طلبك 🎉
      </h1>
      <p style={{ color: 'var(--text-dim)', marginTop: '0.4rem' }}>
        شكرًا لتسوقك من أوبتيما فون — هنبعتلك تحديثات الشحن أولًا بأول.
      </p>

      {order ? (
        <div className="info-card" style={{ marginTop: '1.8rem', textAlign: 'start', animation: 'rise 0.6s 0.2s backwards' }}>
          <div className="info-row">
            <span className="k">رقم الطلب</span>
            <span className="v" style={{ direction: 'ltr' }}>{order.number}</span>
          </div>
          {order.lines.map((line) => (
            <div key={`${line.productId}-${line.variantLabel}`} className="info-row">
              <span className="k">
                {line.quantity}× {line.productName}
              </span>
              <span className="v">{formatPrice(line.unitPrice * line.quantity)}</span>
            </div>
          ))}
          {order.discount > 0 ? (
            <div className="info-row">
              <span className="k">الخصم</span>
              <span className="v" style={{ color: 'var(--success)' }}>
                −{formatPrice(order.discount)}
              </span>
            </div>
          ) : null}
          <div className="info-row">
            <span className="k">الشحن</span>
            <span className="v">{order.shipping === 0 ? 'مجاني' : formatPrice(order.shipping)}</span>
          </div>
          <div className="info-row">
            <span className="k" style={{ fontWeight: 800, color: 'var(--text)' }}>
              الإجمالي المدفوع
            </span>
            <span className="v" style={{ fontSize: '1.15rem' }}>
              {formatPrice(order.total)}
            </span>
          </div>
          <div className="info-row">
            <span className="k">التوصيل إلى</span>
            <span className="v">
              {order.address.city} — {order.address.recipient}
            </span>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
        <Link to="/shop" className="btn btn-gold">
          مواصلة التسوق
        </Link>
        <Link to="/" className="btn btn-ghost">
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
