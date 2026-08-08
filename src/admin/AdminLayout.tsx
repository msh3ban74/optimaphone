import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useStoreData } from '../data/storeData';
import { useThemeStore } from '../store/stores';
import { AdminGate } from './AdminGate';
import { IDLE_LOCK_MS, useAdminAuth } from './adminAuth';

const LINKS = [
  { to: '/admin', end: true, label: 'لوحة القيادة', mark: '◉' },
  { to: '/admin/products', end: false, label: 'الأصناف', mark: '▤' },
  { to: '/admin/inventory', end: false, label: 'المخزون', mark: '▦' },
  { to: '/admin/orders', end: false, label: 'الطلبات', mark: '⛊' },
  { to: '/admin/customers', end: false, label: 'العملاء', mark: '☺' },
  { to: '/admin/coupons', end: false, label: 'كروت الخصم', mark: '✦' },
  { to: '/admin/reports', end: false, label: 'التقارير', mark: '◫' },
  { to: '/admin/tools', end: false, label: 'رسائل الواتساب', mark: '✉' },
  { to: '/admin/settings', end: false, label: 'الإعدادات', mark: '⚙' },
  { to: '/admin/backup', end: false, label: 'النسخ والنشر', mark: '⤓' },
];

/** إطار لوحة الإدارة: قفلٌ، وقائمة جانبية، ومساحة العمل. */
export function AdminLayout() {
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const lock = useAdminAuth((s) => s.lock);
  const touch = useAdminAuth((s) => s.touch);
  const unlocked = useAdminAuth((s) => s.unlocked);
  const newOrders = useStoreData((s) => s.orders.filter((o) => o.status === 'new').length);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  /**
   * قفل الخمول: لوحة تُترك مفتوحة على شاشة المحل أمام الزبائن
   * أسوأ من لوحة بلا قفل. يُفحص النشاط كل دقيقة بدل كل حركة فأرة،
   * فلا يُثقَل التصيير بتحديث حالة في كل إيماءة.
   */
  useEffect(() => {
    if (!unlocked) return;

    const mark = () => touch();
    const events = ['pointerdown', 'keydown', 'focus'] as const;
    for (const e of events) window.addEventListener(e, mark);

    const timer = window.setInterval(() => {
      const { lastActivity } = useAdminAuth.getState();
      if (lastActivity > 0 && Date.now() - lastActivity > IDLE_LOCK_MS) lock();
    }, 60_000);

    return () => {
      for (const e of events) window.removeEventListener(e, mark);
      window.clearInterval(timer);
    };
  }, [unlocked, touch, lock]);

  return (
    <AdminGate>
      <div className="admin-shell">
        <aside className={open ? 'admin-side is-open' : 'admin-side'}>
          <Link to="/admin" className="brand admin-brand">
            <span>أوبتيما</span> <span className="brand-mark">فون</span>
          </Link>
          <p className="admin-side-label">لوحة الإدارة</p>

          <nav className="admin-nav" aria-label="أقسام الإدارة">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'admin-nav-link on' : 'admin-nav-link')}
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true" className="admin-nav-mark">
                  {link.mark}
                </span>
                <span className="grow">{link.label}</span>
                {link.to === '/admin/orders' && newOrders > 0 ? (
                  <span className="count tnum">{newOrders}</span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="admin-side-foot">
            <Link to="/" className="admin-nav-link">
              <span aria-hidden="true" className="admin-nav-mark">
                ↩
              </span>
              <span className="grow">عرض المتجر</span>
            </Link>
            <button type="button" className="admin-nav-link" onClick={toggleTheme}>
              <span aria-hidden="true" className="admin-nav-mark">
                {mode === 'dark' ? '☀' : '☾'}
              </span>
              <span className="grow">{mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
            </button>
            <button type="button" className="admin-nav-link danger" onClick={lock}>
              <span aria-hidden="true" className="admin-nav-mark">
                ⏻
              </span>
              <span className="grow">قفل اللوحة</span>
            </button>
          </div>
        </aside>

        <div className="admin-main">
          <button
            type="button"
            className="admin-burger"
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
            aria-expanded={open}
          >
            ☰
          </button>

          <div className="admin-content">
            <Outlet />
          </div>
        </div>

        {open ? (
          <button
            type="button"
            className="admin-scrim"
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
          />
        ) : null}
      </div>
    </AdminGate>
  );
}
