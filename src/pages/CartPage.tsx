import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useToastStore } from '../components/bits';
import { catalog } from '../data/localCatalogRepository';
import { useCartStore, useCartTotals } from '../store/stores';
import { formatPrice } from '../utils/format';

export function CartPage() {
  const navigate = useNavigate();
  const { lines, coupon, setQuantity, remove, applyCoupon, removeCoupon } = useCartStore();
  const totals = useCartTotals();
  const showToast = useToastStore((s) => s.show);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleCoupon = () => {
    const result = applyCoupon(couponInput);
    if (result === 'applied') {
      setCouponError(null);
      setCouponInput('');
      showToast('✓ تم تفعيل الكوبون');
    } else if (result === 'below-minimum') {
      setCouponError('إجمالي السلة أقل من الحد الأدنى لهذا الكوبون.');
    } else {
      setCouponError('الكود غير صحيح — جرّب WELCOME10');
    }
  };

  if (lines.length === 0) {
    return (
      <div className="container empty">
        <div className="icon">🛍️</div>
        <h2>سلتك فاضية</h2>
        <p>الكنوز في انتظارك — ابدأ بعروض الفلاش اليوم.</p>
        <Link to="/shop" className="btn btn-gold">
          اكتشف المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="container cart-layout">
      <section>
        <h1 className="section-title" style={{ marginBottom: '1.2rem' }}>
          سلة المشتريات
        </h1>
        {lines.map((line) => {
          const product = catalog.getById(line.productId);
          const variant = product?.variants.find((v) => v.id === line.variantId);
          if (!product || !variant) return null;
          const dealActive =
            product.flashDeal && new Date(product.flashDeal.endsAt).getTime() > Date.now();
          const unit = dealActive
            ? variant.price * (1 - product.flashDeal!.percentOff / 100)
            : variant.price;

          return (
            <div key={`${line.productId}-${line.variantId}`} className="cart-line">
              <Link to={`/product/${product.id}`}>
                <img src={product.images[0]} alt={product.name} />
              </Link>
              <div>
                <Link to={`/product/${product.id}`}>
                  <strong>{product.name}</strong>
                </Link>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                  {[variant.color.name, variant.storage, variant.ram].filter(Boolean).join(' · ')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <div className="qty">
                    <button
                      onClick={() => setQuantity(line.productId, line.variantId, line.quantity - 1)}
                      aria-label="تقليل الكمية"
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      onClick={() =>
                        setQuantity(
                          line.productId,
                          line.variantId,
                          Math.min(line.quantity + 1, Math.max(1, variant.stock)),
                        )
                      }
                      aria-label="زيادة الكمية"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remove(line.productId, line.variantId)}
                    style={{ color: 'var(--danger)', fontSize: '0.88rem' }}
                  >
                    إزالة
                  </button>
                </div>
              </div>
              <strong style={{ fontSize: '1.1rem' }}>{formatPrice(unit * line.quantity)}</strong>
            </div>
          );
        })}

        {/* Coupon */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            background: 'var(--surface)',
            padding: '1.1rem 1.3rem',
            marginTop: '1rem',
          }}
        >
          {coupon ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: 'var(--success)' }}>✓ {coupon.code}</strong>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>{coupon.description}</p>
              </div>
              <button onClick={removeCoupon} style={{ color: 'var(--danger)', fontSize: '0.88rem' }}>
                إزالة
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <div className="searchbar" style={{ flex: 1 }}>
                  <span>🎟️</span>
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="كود الخصم"
                    aria-label="كود الخصم"
                    style={{ direction: 'ltr', textAlign: 'end' }}
                  />
                </div>
                <button className="btn btn-fill btn-sm" onClick={handleCoupon}>
                  تفعيل
                </button>
              </div>
              {couponError ? (
                <p style={{ color: 'var(--warning)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {couponError}
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* Summary */}
      <aside className="summary">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>ملخص الطلب</h2>
        <div className="summary-row">
          <span>الإجمالي الفرعي</span>
          <span>{formatPrice(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 ? (
          <div className="summary-row" style={{ color: 'var(--success)' }}>
            <span>الخصم</span>
            <span>−{formatPrice(totals.discount)}</span>
          </div>
        ) : null}
        <div className="summary-row">
          <span>الشحن</span>
          <span style={{ color: totals.shipping === 0 ? 'var(--success)' : undefined }}>
            {totals.shipping === 0 ? 'مجاني' : formatPrice(totals.shipping)}
          </span>
        </div>
        <div className="summary-row total">
          <span>الإجمالي</span>
          <span>{formatPrice(totals.total)}</span>
        </div>
        <button className="btn btn-gold btn-block" style={{ marginTop: '1rem' }} onClick={() => navigate('/checkout')}>
          إتمام الطلب · {formatPrice(totals.total)}
        </button>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.8rem', marginTop: '0.8rem', textAlign: 'center' }}>
          🔒 دفع آمن · شحن مجاني فوق $200
        </p>
      </aside>
    </div>
  );
}
