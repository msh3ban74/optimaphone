import { useMemo, useState } from 'react';

import { useToastStore } from '../components/bits';
import { useStoreData } from '../data/storeData';
import type { AdminOrder } from '../domain/admin';
import { formatNumber, formatPrice } from '../utils/format';

const RANGES = [
  { days: 7, label: 'أسبوع' },
  { days: 30, label: 'شهر' },
  { days: 90, label: 'ثلاثة أشهر' },
  { days: 0, label: 'الكل' },
];

/** الطلبات المحصَّلة، وهي وحدها ما يُحتسب إيرادًا. */
const EARNED = new Set(['delivered']);

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** يهرب حقلًا إلى صيغة CSV سليمة مهما تضمّن فواصل أو أقواسًا. */
function csvCell(value: string | number): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function ordersToCsv(orders: AdminOrder[]): string {
  const header = [
    'رقم الطلب',
    'التاريخ',
    'الحالة',
    'العميل',
    'الهاتف',
    'المدينة',
    'العنوان',
    'الأصناف',
    'قيمة الأصناف',
    'الخصم',
    'الكرت',
    'الشحن',
    'الإجمالي',
    'السداد',
  ];

  const rows = orders.map((o) =>
    [
      o.number,
      o.placedAt.slice(0, 10),
      o.status,
      o.recipient.name,
      o.recipient.phone,
      o.recipient.city,
      o.recipient.address,
      o.lines.map((l) => `${l.quantity}× ${l.productName}`).join(' | '),
      o.subtotal,
      o.discount,
      o.couponCode ?? '',
      o.shipping,
      o.total,
      o.payment,
    ]
      .map(csvCell)
      .join(','),
  );

  // العلامة في المقدّمة تجعل إكسل يقرأ العربية على وجهها.
  return `﻿${header.join(',')}\n${rows.join('\n')}`;
}

export function ReportsView() {
  const orders = useStoreData((s) => s.orders);
  const products = useStoreData((s) => s.products);
  const notify = useToastStore((s) => s.show);

  const [days, setDays] = useState(30);

  const scoped = useMemo(() => {
    if (days === 0) return orders;
    const since = Date.now() - days * 86_400_000;
    return orders.filter((o) => new Date(o.placedAt).getTime() >= since);
  }, [orders, days]);

  const report = useMemo(() => {
    const earned = scoped.filter((o) => EARNED.has(o.status));
    const live = scoped.filter((o) => o.status !== 'cancelled');

    const revenue = earned.reduce((s, o) => s + o.total, 0);
    const discounts = live.reduce((s, o) => s + o.discount, 0);

    // سلسلة يومية متّصلة، فالأيام الخالية تظهر فجوةً لا تُطوى.
    const span = days === 0 ? 30 : days;
    const series: { key: string; total: number; count: number }[] = [];
    const today = new Date();
    for (let i = span - 1; i >= 0; i -= 1) {
      const d = new Date(today.getTime() - i * 86_400_000);
      series.push({ key: d.toISOString().slice(0, 10), total: 0, count: 0 });
    }
    const index = new Map(series.map((p, i) => [p.key, i]));
    for (const o of live) {
      const i = index.get(dayKey(o.placedAt));
      if (i === undefined) continue;
      series[i].total += o.total;
      series[i].count += 1;
    }

    // المبيعات بحسب الفئة، بمطابقة اسم الصنف على الكتالوج.
    const categoryOf = new Map(products.map((p) => [p.name, p.categoryName]));
    const byCategory = new Map<string, number>();
    for (const o of live) {
      for (const l of o.lines) {
        const name = categoryOf.get(l.productName) ?? 'غير مصنّف';
        byCategory.set(name, (byCategory.get(name) ?? 0) + l.unitPrice * l.quantity);
      }
    }

    const byPayment = new Map<string, number>();
    for (const o of live) byPayment.set(o.payment, (byPayment.get(o.payment) ?? 0) + 1);

    return {
      revenue,
      discounts,
      orderCount: scoped.length,
      liveCount: live.length,
      cancelled: scoped.length - live.length,
      average: earned.length > 0 ? revenue / earned.length : 0,
      units: live.reduce((s, o) => s + o.lines.reduce((n, l) => n + l.quantity, 0), 0),
      series,
      byCategory: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
      byPayment: [...byPayment.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [scoped, products, days]);

  const peak = Math.max(1, ...report.series.map((p) => p.total));
  const categoryPeak = Math.max(1, ...report.byCategory.map(([, v]) => v));

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <h1 className="h2">التقارير</h1>
        <div className="admin-chips">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              className={days === r.days ? 'chip on' : 'chip'}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-kpis">
        <Kpi label="الإيراد المحصَّل" value={formatPrice(report.revenue)} />
        <Kpi label="الطلبات" value={formatNumber(report.orderCount)} />
        <Kpi label="الملغاة" value={formatNumber(report.cancelled)} />
        <Kpi label="متوسط الطلب" value={formatPrice(report.average)} />
        <Kpi label="القطع المباعة" value={formatNumber(report.units)} />
        <Kpi label="قيمة الخصومات" value={formatPrice(report.discounts)} />
      </div>

      <section className="admin-panel">
        <h2 className="h3">حركة الطلبات يومًا بيوم</h2>
        {report.liveCount === 0 ? (
          <p className="muted small">لا طلبات في هذه المدة.</p>
        ) : (
          <div className="chart" role="img" aria-label="حركة الطلبات اليومية">
            {report.series.map((point) => (
              <div
                key={point.key}
                className="chart-col"
                title={`${point.key} — ${formatPrice(point.total)} (${point.count})`}
              >
                <div
                  className={point.total > 0 ? 'chart-bar' : 'chart-bar is-empty'}
                  style={{ height: `${Math.max(2, (point.total / peak) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        )}
        {report.liveCount > 0 ? (
          <p className="faint small center-text">
            أعلى يوم {formatPrice(peak)} · المدة {formatNumber(report.series.length)} يومًا
          </p>
        ) : null}
      </section>

      <div className="admin-split">
        <section className="admin-panel">
          <h2 className="h3">المبيعات بحسب الفئة</h2>
          {report.byCategory.length === 0 ? (
            <p className="muted small">لا بيانات بعد.</p>
          ) : (
            <ul className="admin-bars">
              {report.byCategory.map(([name, value]) => (
                <li key={name}>
                  <div className="admin-bar-head">
                    <span>{name}</span>
                    <span className="tnum">{formatPrice(value)}</span>
                  </div>
                  <div className="admin-bar-track">
                    <div
                      className="admin-bar-fill"
                      style={{ width: `${(value / categoryPeak) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-panel">
          <h2 className="h3">وسائل السداد</h2>
          {report.byPayment.length === 0 ? (
            <p className="muted small">لا بيانات بعد.</p>
          ) : (
            <ul className="admin-list">
              {report.byPayment.map(([id, count]) => (
                <li key={id} className="admin-list-row">
                  <span className="grow">{paymentLabel(id)}</span>
                  <span className="tnum strong">{formatNumber(count)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-panel stack-sm">
        <h2 className="h3">تصدير للمحاسبة</h2>
        <p className="small muted">
          ملف CSV بكل طلبات المدة المختارة، يفتحه إكسل وجداول جوجل مباشرة.
        </p>
        <div>
          <button
            type="button"
            className="btn btn-gold"
            disabled={scoped.length === 0}
            onClick={() => {
              const blob = new Blob([ordersToCsv(scoped)], {
                type: 'text/csv;charset=utf-8',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `optimaphone-orders-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              notify('نُزّل ملف الطلبات');
            }}
          >
            تنزيل الطلبات CSV
          </button>
        </div>
      </section>
    </div>
  );
}

function paymentLabel(id: string): string {
  const names: Record<string, string> = {
    instapay: 'إنستاباي',
    wallet: 'محفظة إلكترونية',
    cod: 'الدفع عند الاستلام',
    cash: 'نقدًا في المعرض',
  };
  return names[id] ?? id;
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-kpi">
      <span className="admin-kpi-label">{label}</span>
      <span className="admin-kpi-value tnum">{value}</span>
    </div>
  );
}
