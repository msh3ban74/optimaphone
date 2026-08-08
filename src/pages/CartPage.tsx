import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmptyState, ProductImage, Quantity } from '../components/bits';
import { useCatalog } from '../data/localCatalogRepository';
import { useStoreData } from '../data/storeData';
import { useCartStore, useCartTotals, useCouponStore } from '../store/stores';
import { checkCoupon } from '../utils/coupons';
import { formatPrice, variantLabel } from '../utils/format';

export function CartPage() {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const totals = useCartTotals();
  const transferNumber = useStoreData((s) => s.settings.transferNumberLocal);

  const appliedCode = useCouponStore((s) => s.code);
  const applyCoupon = useCouponStore((s) => s.apply);
  const clearCoupon = useCouponStore((s) => s.clear);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const resolved = lines.flatMap((line) => {
    const product = catalog.getById(line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    return product && variant ? [{ line, product, variant }] : [];
  });

  if (resolved.length === 0) {
    return (
      <div className="wrap">
        <EmptyState
          mark="⛊"
          title="السلة خالية"
          body="لم تُضف أصناف بعد."
          action={
            <Link to="/shop" className="btn btn-gold">
              تصفّح المعروضات
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="wrap cart">
      <section>
        <h1 className="h1">السلة</h1>
        <hr className="gold-rule" />

        <div>
          {resolved.map(({ line, product, variant }) => (
            <article key={`${line.productId}-${line.variantId}`} className="cart-line">
              <Link to={`/product/${product.id}`} className="cart-thumb">
                <ProductImage src={product.images[0]} alt={product.name} />
              </Link>

              <div className="stack-sm">
                <Link to={`/product/${product.id}`}>
                  <h2 className="h3">{product.name}</h2>
                </Link>
                <p className="faint">
                  {variantLabel([variant.color?.name, variant.storage, variant.ram])}
                </p>
                <div className="row wrap-flex">
                  <Quantity
                    value={line.quantity}
                    max={Math.max(1, variant.stock)}
                    onChange={(q) => setQuantity(line.productId, line.variantId, q)}
                  />
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => remove(line.productId, line.variantId)}
                  >
                    إزالة
                  </button>
                </div>
              </div>

              <p className="strong">{formatPrice(variant.price * line.quantity)}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className="summary">
        <h2 className="h2">الملخّص</h2>
        <hr className="rule" />

        <div className="summary-row">
          <span>إجمالي الأصناف</span>
          <span className="tnum">{formatPrice(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 ? (
          <div className="summary-row">
            <span>
              الخصم <span className="ltr faint">{totals.couponCode}</span>
            </span>
            <span className="ok tnum">− {formatPrice(totals.discount)}</span>
          </div>
        ) : null}
        <div className="summary-row">
          <span>الشحن</span>
          <span className={totals.shipping === 0 ? 'ok' : 'tnum'}>
            {totals.shipping === 0 ? 'مشمول' : formatPrice(totals.shipping)}
          </span>
        </div>
        <div className="summary-total">
          <span>الإجمالي</span>
          <span className="tnum">{formatPrice(totals.total)}</span>
        </div>

        {totals.couponCode ? (
          <div className="coupon-applied">
            <span className="ok small">
              طُبّق الكرت <span className="ltr strong">{totals.couponCode}</span>
            </span>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                clearCoupon();
                setCouponInput('');
                setCouponError(null);
              }}
            >
              إزالة
            </button>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="c-input">كرت خصم</label>
            <div className="coupon-row">
              <input
                id="c-input"
                className="ltr"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                maxLength={24}
                placeholder="اكتب الرمز"
              />
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  const result = checkCoupon(couponInput, lines, totals.subtotal);
                  if (!result.ok) {
                    setCouponError(result.reason ?? 'رمز غير صالح.');
                    return;
                  }
                  setCouponError(null);
                  applyCoupon(couponInput);
                }}
              >
                تطبيق
              </button>
            </div>
            {couponError ? <span className="field-bad small">{couponError}</span> : null}
            {appliedCode && !totals.couponCode ? (
              <span className="field-bad small">لم يعد الكرت ساريًا على هذه السلة.</span>
            ) : null}
          </div>
        )}

        <button
          type="button"
          className="btn btn-gold btn-block"
          onClick={() => navigate('/checkout')}
        >
          إتمام الطلب
        </button>

        <p className="faint center-text">
          السداد عبر إنستاباي أو المحفظة أو عند الاستلام — رقم {transferNumber}
        </p>
      </aside>
    </div>
  );
}
