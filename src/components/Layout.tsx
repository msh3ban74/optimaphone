import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { useCartTotals, useThemeStore, useWishlistStore } from '../store/stores';
import { Toast } from './bits';

function Header() {
  const { itemCount } = useCartTotals();
  const wishlistCount = useWishlistStore((s) => s.ids.length);
  const { mode, toggle } = useThemeStore();

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          OPTIMA<em>PHONE</em>
        </Link>
        <nav className="nav" aria-label="التنقل الرئيسي">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            الرئيسية
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => (isActive ? 'active' : '')}>
            المتجر
          </NavLink>
          <NavLink to="/shop?deal=1" className={() => ''}>
            عروض فلاش ⚡
          </NavLink>
        </nav>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={toggle}
            aria-label={mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            title={mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/wishlist" className="icon-btn" aria-label="المفضلة">
            ♡{wishlistCount > 0 ? <span className="badge">{wishlistCount}</span> : null}
          </Link>
          <Link to="/cart" className="icon-btn" aria-label="سلة المشتريات">
            🛍️
            {itemCount > 0 ? <span className="badge">{itemCount > 9 ? '9+' : itemCount}</span> : null}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ marginBottom: '0.6rem' }}>
              OPTIMA<em>PHONE</em>
            </div>
            <p>
              متجر التقنية الفاخر — أحدث الموبايلات واللابتوبات والإكسسوارات، بضمان رسمي
              وشحن سريع وعروض يومية.
            </p>
          </div>
          <div>
            <h4>تسوّق</h4>
            <Link to="/shop?category=phones">الموبايلات</Link>
            <Link to="/shop?category=laptops">اللابتوبات</Link>
            <Link to="/shop?category=audio">الصوتيات</Link>
            <Link to="/shop?deal=1">عروض فلاش</Link>
          </div>
          <div>
            <h4>خدمة العملاء</h4>
            <Link to="/cart">سلة المشتريات</Link>
            <Link to="/wishlist">المفضلة</Link>
            <a href="#!">سياسة الاسترجاع (30 يوم)</a>
            <a href="#!">الضمان</a>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.2rem', textAlign: 'center' }}>
          © {new Date().getFullYear()} OptimaPhone — صُنع بشغف ✨
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname, location.search]);

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <Toast />
    </>
  );
}
