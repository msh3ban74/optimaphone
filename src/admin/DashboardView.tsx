import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ORDER_STATUSES, orderStatusLabel } from '../domain/admin';
import { useStoreData } from '../data/storeData';
import { formatNumber, formatPrice } from '../utils/format';

/** إيراد الطلبات المحصَّلة فعلًا: المُسلَّم دون الملغى. */
const EARNED: string[] = ['delivered'];

export function DashboardView() {
  const products = useStoreData((s) => s.products);
  const orders = useStoreData((s) => s.orders);
  const coupons = useStoreData((s) => s.coupons);
  const threshold = useStoreData((s) => s.settings.lowStockThreshold);

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== 'cancelled');
    const revenue = orders
      .filter((o) => EARNED.includes(o.status))
      .reduce((sum, o) => sum + o.total, 0);

    const pipeline = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    const units = products.reduce(
      (sum, p) => sum + p.variants.reduce((s, v) => s + v.stock, 0),
      0,
    );

    const stockValue = products.reduce(
      (sum, p) => sum + p.variants.reduce((s, v) => s + v.stock * v.price, 0),
      0,
    );

    const lowStock = products.flatMap((p) =>
      p.variants
        .filter((v) => v.stock <= threshold)
        .map((v) => ({ product: p, variant: v })),
    );

    // الأكثر مبيعًا يُحسب من أسطر الطلبات غير الملغاة.
    const sold = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const order of live) {
      for (const line of order.lines) {
        const entry = sold.get(line.productName) ?? {
          name: line.productName,
          qty: 0,
          revenue: 0,
        };
        entry.qty += line.quantity;
        entry.revenue += line.unitPrice * line.quantity;
        sold.set(line.productName, entry);
      }
    }
    const top = [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

    const averageOrder = live.length > 0 ? revenue / Math.max(1, orders.filter((o) => EARNED.includes(o.status)).length) : 0;

    return {
      revenue,
      orderCount: orders.length,
      openCount: orders.filter((o) => o.status === 'new').length,
      pipeline,
      units,
      stockValue,
      lowStock,
      top,
      averageOrder,
      published: products.length,
      activeCoupons: coupons.filter((c) => c.active).length,
    };
  }, [orders, products, coupons, threshold]);

  const maxTop = Math.max(1, ...stats.top.map((t) => t.qty));

  return (
    <div className="stack">
      <div className="admin-kpis">
        <Kpi label="إيراد المُسلَّم" value={formatPrice(stats.revenue)} />
        <Kpi label="إجمالي الطلبات" value={formatNumber(stats.orderCount)} />
        <Kpi label="طلبات جديدة" value={formatNumber(stats.openCount)} tone={stats.openCount > 0 ? 'gold' : undefined} />
        <Kpi label="متوسط الطلب" value={formatPrice(stats.averageOrder)} />
        <Kpi label="الأصناف" value={formatNumber(stats.published)} />
        <Kpi label="قطع في المخزن" value={formatNumber(stats.units)} />
        <Kpi label="قيمة المخزون" value={formatPrice(stats.stockValue)} />
        <Kpi label="كروت فعّالة" value={formatNumber(stats.activeCoupons)} />
      </div>

      <section className="admin-panel">
        <h2 className="h3">مسار الطلبات</h2>
        {stats.orderCount === 0 ? (
          <p className="muted small">لا توجد طلبات بعد.</p>
        ) : (
          <div className="admin-pipeline">
            {ORDER_STATUSES.map((s) => (
              <div key={s.id} className="admin-pipe">
                <span className={`dot tone-${s.tone}`} aria-hidden="true" />
                <span className="grow">{s.label}</span>
                <span className="tnum strong">{formatNumber(stats.pipeline[s.id] ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="admin-split">
        <section className="admin-panel">
          <h2 className="h3">الأكثر مبيعًا</h2>
          {stats.top.length === 0 ? (
            <p className="muted small">لا مبيعات مسجَّلة بعد.</p>
          ) : (
            <ul className="admin-bars">
              {stats.top.map((t) => (
                <li key={t.name}>
                  <div className="admin-bar-head">
                    <span>{t.name}</span>
                    <span className="tnum">{formatNumber(t.qty)}</span>
                  </div>
                  <div className="admin-bar-track">
                    <div
                      className="admin-bar-fill"
                      style={{ width: `${(t.qty / maxTop) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-panel">
          <h2 className="h3">
            مخزون على الوشك <span className="faint small">({formatNumber(threshold)} فأقل)</span>
          </h2>
          {stats.lowStock.length === 0 ? (
            <p className="muted small">
              {stats.published === 0 ? 'لم تُضَف أصناف بعد.' : 'المخزون في وضع مطمئن.'}
            </p>
          ) : (
            <ul className="admin-list">
              {stats.lowStock.slice(0, 8).map(({ product, variant }) => (
                <li key={`${product.id}-${variant.id}`} className="admin-list-row">
                  <Link to={`/admin/products/${product.id}`} className="grow">
                    {product.name}
                    <span className="faint small">
                      {' '}
                      {[variant.color?.name, variant.storage].filter(Boolean).join(' · ')}
                    </span>
                  </Link>
                  <span className={variant.stock === 0 ? 'pill tone-bad' : 'pill tone-warn'}>
                    {variant.stock === 0 ? 'نفد' : `باقٍ ${formatNumber(variant.stock)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-panel">
        <div className="row-between">
          <h2 className="h3">أحدث الطلبات</h2>
          <Link to="/admin/orders" className="text-btn">
            الكل
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="muted small">
            لا طلبات بعد. الطلبات التي تصلك على الواتساب تُسجَّل من صفحة الطلبات.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>العميل</th>
                  <th>الحالة</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td className="tnum">
                      <Link to={`/admin/orders/${o.id}`}>{o.number}</Link>
                    </td>
                    <td>{o.recipient.name}</td>
                    <td>
                      <span className={`pill tone-${statusTone(o.status)}`}>
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="tnum">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export function statusTone(status: string): string {
  return ORDER_STATUSES.find((s) => s.id === status)?.tone ?? 'info';
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={tone ? `admin-kpi is-${tone}` : 'admin-kpi'}>
      <span className="admin-kpi-label">{label}</span>
      <span className="admin-kpi-value tnum">{value}</span>
    </div>
  );
}
