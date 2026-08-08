import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { STORE } from '../config/store';
import { useSmoothScroll } from '../motion/useSmoothScroll';
import { RouteTransition } from './RouteTransition';
import { useCartTotals, useThemeStore, useWishlistStore } from '../store/stores';
import { Toast } from './bits';

function navClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'on' : '';
}

function Header() {
  const { itemCount } = useCartTotals();
  const savedCount = useWishlistStore((s) => s.ids.length);
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link to="/" className="brand">
          <span>أوبتيما</span>
          <span className="brand-mark">فون</span>
        </Link>

        <nav className="nav" aria-label="التنقل الرئيسي">
          <NavLink to="/" end className={navClass}>
            الواجهة
          </NavLink>
          <NavLink to="/shop" className={navClass}>
            المعروضات
          </NavLink>
          <NavLink to="/wishlist" className={navClass}>
            المختارات
          </NavLink>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            title={mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {mode === 'dark' ? '☀' : '☾'}
          </button>

          <Link to="/wishlist" className="icon-btn" aria-label="المختارات">
            ♡
            {savedCount > 0 ? <span className="count tnum">{savedCount}</span> : null}
          </Link>

          <Link to="/cart" className="icon-btn" aria-label="السلة">
            ⛊
            {itemCount > 0 ? (
              <span className="count tnum">{itemCount > 99 ? '99' : itemCount}</span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <p className="brand">
              <span>أوبتيما</span> <span className="brand-mark">فون</span>
            </p>
            <p className="small">{STORE.tagline}</p>
            <hr className="gold-rule" />
          </div>

          <div>
            <h4>المتجر</h4>
            <div className="footer-links">
              <Link to="/shop">المعروضات</Link>
              <Link to="/wishlist">المختارات</Link>
              <Link to="/cart">السلة</Link>
            </div>
          </div>

          <div>
            <h4>التواصل</h4>
            <div className="footer-links">
              <a
                href={`https://wa.me/${STORE.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                واتساب
              </a>
              <a href={STORE.facebook} target="_blank" rel="noopener noreferrer">
                فيسبوك
              </a>
              <Link to="/privacy">الخصوصية</Link>
            </div>
          </div>
        </div>

        <div className="footer-base">
          <span>
            جميع الحقوق محفوظة — {STORE.name} {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const location = useLocation();

  useSmoothScroll();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname, location.search]);

  return (
    <>
      <Header />
      <main id="main">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <Footer />
      <Toast />
    </>
  );
}
