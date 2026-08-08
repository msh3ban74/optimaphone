import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Countdown, Price, Reveal, Stars, effectivePrice, useToastStore } from '../components/bits';
import { ProductCard } from '../components/ProductCard';
import { catalog } from '../data/localCatalogRepository';
import { useCartStore, useRecentStore, useWishlistStore } from '../store/stores';
import { deliveryEstimate, formatCompactCount, formatPrice } from '../utils/format';

const INSTALLMENT_MONTHS = [3, 6, 12, 24];

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = id ? catalog.getById(id) : undefined;

  const addToCart = useCartStore((s) => s.add);
  const record = useRecentStore((s) => s.record);
  const saved = useWishlistStore((s) => s.ids.includes(id ?? ''));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const showToast = useToastStore((s) => s.show);

  const [imageIndex, setImageIndex] = useState(0);
  const [colorName, setColorName] = useState(product?.variants[0]?.color.name ?? '');
  const [storage, setStorage] = useState(product?.variants[0]?.storage);
  const [months, setMonths] = useState(12);
  const [openSpec, setOpenSpec] = useState<string | null>(product?.specGroups[0]?.title ?? null);

  useEffect(() => {
    if (product) {
      record(product.id);
      setImageIndex(0);
      setColorName(product.variants[0]?.color.name ?? '');
      setStorage(product.variants[0]?.storage);
      setOpenSpec(product.specGroups[0]?.title ?? null);
    }
  }, [product, record]);

  const related = useMemo(() => (product ? catalog.getRelated(product.id, 4) : []), [product]);

  if (!product) {
    return (
      <div className="container empty">
        <div className="icon">🔎</div>
        <h2>المنتج غير موجود</h2>
        <p>ربما تم حذفه من الكتالوج.</p>
        <Link to="/shop" className="btn btn-gold">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  const colors = [...new Map(product.variants.map((v) => [v.color.name, v.color])).values()];
  const storages = [
    ...new Set(
      product.variants
        .filter((v) => v.color.name === colorName)
        .map((v) => v.storage)
        .filter((s): s is string => s !== undefined),
    ),
  ];

  const selectedVariant =
    product.variants.find(
      (v) => v.color.name === colorName && (storages.length === 0 || v.storage === storage),
    ) ??
    product.variants.find((v) => v.color.name === colorName) ??
    product.variants[0];

  const dealActive =
    product.flashDeal && new Date(product.flashDeal.endsAt).getTime() > Date.now();
  const price = effectivePrice(product, selectedVariant);

  const selectColor = (name: string) => {
    setColorName(name);
    const first = product.variants.find((v) => v.color.name === name);
    if (first?.storage) setStorage(first.storage);
  };

  const handleAdd = () => {
    addToCart(product.id, selectedVariant.id);
    showToast('✓ تمت الإضافة إلى السلة');
  };

  const buyNow = () => {
    addToCart(product.id, selectedVariant.id);
    navigate('/checkout');
  };

  return (
    <div className="container">
      <div className="product-layout">
        {/* Gallery */}
        <div>
          <div className="gallery-main">
            <img src={product.images[imageIndex]} alt={product.name} />
          </div>
          {product.images.length > 1 ? (
            <div className="gallery-thumbs">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={i === imageIndex ? 'active' : ''}
                  onClick={() => setImageIndex(i)}
                  aria-label={`صورة ${i + 1}`}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div>
          <div className="card-brand">
            {product.brand} · {product.category}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBlock: '0.3rem' }}>
            {product.name}
          </h1>
          <p style={{ color: 'var(--text-dim)' }}>{product.tagline}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBlock: '0.7rem' }}>
            <Stars rating={product.rating} />
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              {product.rating} · {formatCompactCount(product.reviewCount)} تقييم
            </span>
          </div>

          <Price product={product} variant={selectedVariant} large />

          {dealActive ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border)',
                background: 'var(--surface-alt)',
                borderRadius: 'var(--r-md)',
                padding: '0.7rem 1rem',
                marginBlock: '0.9rem',
              }}
            >
              <strong style={{ color: 'var(--danger)' }}>
                ⚡ عرض فلاش −{product.flashDeal!.percentOff}%
              </strong>
              <Countdown endsAt={product.flashDeal!.endsAt} />
            </div>
          ) : null}

          {/* Color */}
          <h3 style={{ marginBlock: '1.1rem 0.5rem', fontSize: '1rem' }}>
            اللون — <span style={{ color: 'var(--text-dim)' }}>{colorName}</span>
          </h3>
          <div className="swatches">
            {colors.map((c) => (
              <button
                key={c.name}
                className={`swatch${c.name === colorName ? ' active' : ''}`}
                onClick={() => selectColor(c.name)}
                aria-label={`اللون ${c.name}`}
                title={c.name}
              >
                <i style={{ background: c.hex }} />
              </button>
            ))}
          </div>

          {/* Storage */}
          {storages.length > 0 ? (
            <>
              <h3 style={{ marginBlock: '1.1rem 0.5rem', fontSize: '1rem' }}>المواصفات</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {storages.map((s) => {
                  const variantFor = product.variants.find(
                    (v) => v.color.name === colorName && v.storage === s,
                  );
                  return (
                    <button
                      key={s}
                      className={`chip${s === storage ? ' active' : ''}`}
                      onClick={() => setStorage(s)}
                    >
                      {variantFor?.ram ? `${s} · ${variantFor.ram}` : s}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {/* Availability */}
          <div className="info-card" style={{ marginBlock: '1.2rem' }}>
            <div className="info-row">
              <span className="k">التوفر</span>
              <span
                className="v"
                style={{ color: selectedVariant.stock > 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {selectedVariant.stock > 5
                  ? 'متوفر'
                  : selectedVariant.stock > 0
                    ? `باقي ${selectedVariant.stock} فقط`
                    : 'غير متوفر'}
              </span>
            </div>
            <div className="info-row">
              <span className="k">التوصيل المجاني</span>
              <span className="v" style={{ direction: 'ltr' }}>{deliveryEstimate(2, 4)}</span>
            </div>
            <div className="info-row">
              <span className="k">الضمان</span>
              <span className="v">{product.warrantyMonths} شهر ضمان رسمي</span>
            </div>
          </div>

          {/* Installments */}
          <h3 style={{ marginBlock: '0.4rem 0.5rem', fontSize: '1rem' }}>قسّطها براحتك</h3>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {INSTALLMENT_MONTHS.map((m) => (
              <button
                key={m}
                className={`chip${months === m ? ' active' : ''}`}
                onClick={() => setMonths(m)}
              >
                {m} شهر
              </button>
            ))}
          </div>
          <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>
            <strong style={{ color: 'var(--text)' }}>{formatPrice(price / months)}</strong> شهريًا
            لمدة {months} شهر · بدون فوائد 0%
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '0.7rem', marginTop: '1.4rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-gold"
              onClick={handleAdd}
              disabled={selectedVariant.stock === 0}
              style={{ flex: 1, minWidth: 160 }}
            >
              🛍️ أضف إلى السلة
            </button>
            <button
              className="btn btn-fill"
              onClick={buyNow}
              disabled={selectedVariant.stock === 0}
              style={{ flex: 1, minWidth: 160 }}
            >
              اشترِ الآن
            </button>
            <button
              className={`btn btn-ghost${saved ? ' saved' : ''}`}
              onClick={() => {
                toggleWishlist(product.id);
                showToast(saved ? 'تمت الإزالة من المفضلة' : '♥ أُضيف إلى المفضلة');
              }}
              aria-label="المفضلة"
              style={{ color: saved ? 'var(--danger)' : undefined }}
            >
              {saved ? '♥' : '♡'}
            </button>
          </div>
        </div>
      </div>

      {/* Highlights + description */}
      <Reveal>
        <section className="section">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>
            أبرز المميزات
          </h2>
          <div style={{ display: 'grid', gap: '0.5rem', maxWidth: '52rem' }}>
            {product.highlights.map((h) => (
              <div key={h} style={{ display: 'flex', gap: '0.6rem', alignItems: 'baseline' }}>
                <span style={{ color: 'var(--accent)' }}>◆</span>
                <span style={{ color: 'var(--text-dim)' }}>{h}</span>
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--text-dim)', marginTop: '1rem', maxWidth: '52rem' }}>
            {product.description}
          </p>
        </section>
      </Reveal>

      {/* Specs */}
      <Reveal>
        <section className="section">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>
            المواصفات التقنية
          </h2>
          <div style={{ maxWidth: '46rem' }}>
            {product.specGroups.map((group) => {
              const open = openSpec === group.title;
              return (
                <div key={group.title} className="spec-group">
                  <button className="spec-head" onClick={() => setOpenSpec(open ? null : group.title)}>
                    <span>{group.title}</span>
                    <span style={{ color: 'var(--text-faint)' }}>{open ? '−' : '+'}</span>
                  </button>
                  {open ? (
                    <div className="spec-body">
                      {group.specs.map((spec) => (
                        <div key={spec.label} className="spec-row">
                          <span className="k">{spec.label}</span>
                          <span style={{ direction: 'ltr' }}>{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </Reveal>

      {/* Reviews */}
      <Reveal>
        <section className="section">
          <h2 className="section-title" style={{ marginBottom: '1rem' }}>
            آراء العملاء ({formatCompactCount(product.reviewCount)})
          </h2>
          <div style={{ maxWidth: '46rem' }}>
            {product.reviews.map((review) => (
              <div key={review.id} className="review">
                <div className="review-head">
                  <strong>{review.author}</strong>
                  {review.verified ? <span className="verified">✓ مشترٍ موثّق</span> : null}
                </div>
                <Stars rating={review.rating} />
                <p style={{ fontWeight: 700, marginTop: '0.3rem' }}>{review.title}</p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem' }}>{review.body}</p>
                <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem', marginTop: '0.4rem', direction: 'ltr', textAlign: 'end' }}>
                  {review.date}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Related */}
      {related.length > 0 ? (
        <Reveal>
          <section className="section">
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              قد يعجبك أيضًا
            </h2>
            <div className="rail">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}
    </div>
  );
}
