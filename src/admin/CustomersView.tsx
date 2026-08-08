import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useStoreData } from '../data/storeData';
import { formatDate, formatNumber, formatPrice } from '../utils/format';
import { customerWhatsappLink } from '../utils/whatsapp';

/**
 * العملاء مشتقّون من دفتر الطلبات، لا جدول مستقلًّا لهم.
 * الهاتف هو المفتاح، فهو ما لا يتبدّل من العميل الواحد.
 */
export function CustomersView() {
  const orders = useStoreData((s) => s.orders);
  const [text, setText] = useState('');

  const customers = useMemo(() => {
    const byPhone = new Map<
      string,
      {
        phone: string;
        name: string;
        city: string;
        orders: number;
        spent: number;
        cancelled: number;
        last: string;
      }
    >();

    for (const o of orders) {
      const phone = o.recipient.phone || '—';
      const entry = byPhone.get(phone) ?? {
        phone,
        name: o.recipient.name,
        city: o.recipient.city,
        orders: 0,
        spent: 0,
        cancelled: 0,
        last: o.placedAt,
      };

      entry.orders += 1;
      if (o.status === 'cancelled') entry.cancelled += 1;
      else entry.spent += o.total;
      if (o.placedAt > entry.last) {
        entry.last = o.placedAt;
        entry.name = o.recipient.name;
        entry.city = o.recipient.city;
      }
      byPhone.set(phone, entry);
    }

    const term = text.trim().toLowerCase();
    return [...byPhone.values()]
      .filter((c) => (term ? c.name.toLowerCase().includes(term) || c.phone.includes(term) : true))
      .sort((a, b) => b.spent - a.spent);
  }, [orders, text]);

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <div>
          <h1 className="h2">العملاء</h1>
          <p className="small muted">
            مشتقّون من الطلبات المسجَّلة. المتكرِّرون في الأعلى.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="admin-panel center-text stack-sm">
          <p className="h3">لا عملاء بعد</p>
          <p className="muted small">سجّل طلبًا أولًا ليظهر صاحبه هنا.</p>
          <div>
            <Link to="/admin/orders" className="btn btn-gold">
              الذهاب إلى الطلبات
            </Link>
          </div>
        </div>
      ) : (
        <>
          <input
            className="admin-search"
            placeholder="ابحث بالاسم أو الهاتف"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="بحث في العملاء"
          />

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>المدينة</th>
                  <th>الطلبات</th>
                  <th>أنفق</th>
                  <th>آخر طلب</th>
                  <th aria-label="إجراءات" />
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.phone}>
                    <td>
                      <span className="strong">{c.name}</span>
                      <div className="faint small ltr">{c.phone}</div>
                    </td>
                    <td className="small">{c.city || '—'}</td>
                    <td className="tnum">
                      {formatNumber(c.orders)}
                      {c.cancelled > 0 ? (
                        <span className="faint small"> ({formatNumber(c.cancelled)} ملغى)</span>
                      ) : null}
                    </td>
                    <td className="tnum">{formatPrice(c.spent)}</td>
                    <td className="small">{formatDate(c.last)}</td>
                    <td className="admin-row-actions">
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => {
                          const link = customerWhatsappLink(c.phone, '');
                          if (link) window.open(link, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        واتساب
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
