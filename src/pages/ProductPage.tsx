import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { EmptyState, Price, ProductImage, Swatch, useToastStore } from '../components/bits';
import { ProductCard } from '../components/ProductCard';
import { catalog } from '../data/localCatalogRepository';
import { useCartStore, useWishlistStore } from '../store/stores';
import { variantLabel } from '../utils/format';

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = id ? catalog.getById(id) : undefined;

  const addToCart = useCartStore((s) => s.add);
  const saved = useWishlistStore((s) => s.ids.includes(id ?? ''));
  const toggleSaved = useWishlistStore((s) => s.toggle);
  const notify = useToastStore((s) => s.show);

  const [imageIndex, setImageIndex] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [openSpec, setOpenSpec] = useState<string | null>(null);

  const related = useMemo(() => (product ? catalog.getRelated(product.id) : []), [product]);

  if (!product) {
    return (
      <div className="wrap">
        <EmptyState
          mark="⌕"
          title="الصنف غير متاح"
          body="قد يكون هذا الصنف قد رُفع من المعروضات."
          action={
            <Link to="/shop" className="btn btn-gold">
              العودة إلى المعروضات
            </Link>
          }
        />
      </div>
    );
  }

  const colors = [
    ...new Map(
      product.variants
        .filter((v) => v.color)
        .map((v) => [v.color!.name, v.color!] as const),
    ).values(),
  ];

  const selected =
    product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  const selectedColorName = selected?.color?.name;

  const configurations = product.variants.filter(
    (v) => !selectedColorName || v.color?.name === selectedColorName,
  );

  const inStock = (selected?.stock ?? 0) > 0;

  const selectColor = (name: string) => {
    const match = product.variants.find((v) => v.color?.name === name);
    if (match) setVariantId(match.id);
  };

  const addSelected = () => {
    if (!selected) return;
    addToCart(product.id, selected.id);
    notify('أُضيف إلى السلة');
  };

  const buyNow = () => {
    if (!selected) return;
    addToCart(product.id, selected.id);
    navigate('/checkout');
  };

  return (
    <div className="wrap">
      <div className="product">
        <div>
          <div className="gallery">
            <ProductImage src={product.images[imageIndex]} alt={product.name} />
          </div>
          {product.images.length > 1 ? (
            <div className="thumbs">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  className={i === imageIndex ? 'thumb on' : 'thumb'}
                  onClick={() => setImageIndex(i)}
                  aria-label={`الصورة ${i + 1}`}
                  aria-pressed={i === imageIndex}
                >
                  <ProductImage src={img} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="stack">
          <div>
            <p className="card-brand">{product.brandName}</p>
            <h1 className="h1">{product.name}</h1>
            {product.tagline ? <p className="muted">{product.tagline}</p> : null}
          </div>

          <Price variant={selected} large />

          {selected ? (
            <p className="faint">
              {variantLabel([selected.color?.name, selected.storage, selected.ram])}
            </p>
          ) : null}

          {colors.length > 0 ? (
            <div className="stack-sm">
              <h2 className="h3">
                اللون <span className="muted">— {selectedColorName}</span>
              </h2>
              <div className="swatches">
                {colors.map((c) => (
                  <Swatch
                    key={c.name}
                    color={c}
                    selected={c.name === selectedColorName}
                    onSelect={() => selectColor(c.name)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {configurations.length > 1 ? (
            <div className="stack-sm">
              <h2 className="h3">الإصدار</h2>
              <div className="chips">
                {configurations.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={v.id === selected?.id ? 'chip on' : 'chip'}
                    onClick={() => setVariantId(v.id)}
                  >
                    {variantLabel([v.storage, v.ram]) || 'قياسي'}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <dl className="panel">
            <div className="panel-row">
              <dt>التوفر</dt>
              <dd className={inStock ? 'ok' : 'bad'}>
                {inStock ? `متوفر — ${selected?.stock} قطعة` : 'نفدت الكمية'}
              </dd>
            </div>
            {product.warrantyMonths ? (
              <div className="panel-row">
                <dt>الضمان</dt>
                <dd>{product.warrantyMonths} شهرًا</dd>
              </div>
            ) : null}
          </dl>

          {/* شريطُ شراءٍ يبقى في المرأى مهما طال التمرير */}
          <div className="buybar">
            <div className="buybar-price">
              <span className="faint">الإجمالي</span>
              <Price variant={selected} />
            </div>
            <button type="button" className="btn btn-gold" onClick={buyNow} disabled={!inStock}>
              اطلبه الآن
              <span className="btn-arrow" aria-hidden="true">
                ←
              </span>
            </button>
            <button type="button" className="btn btn-glass" onClick={addSelected} disabled={!inStock}>
              أضف إلى السلة
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                toggleSaved(product.id);
                notify(saved ? 'أُزيل من المختارات' : 'أُضيف إلى المختارات');
              }}
              aria-pressed={saved}
              aria-label={saved ? 'إزالة من المختارات' : 'إضافة إلى المختارات'}
            >
              {saved ? '♥' : '♡'}
            </button>
          </div>
        </div>
      </div>

      {product.highlights && product.highlights.length > 0 ? (
        <section className="section-tight narrow-left">
          <h2 className="h2">أبرز الخصائص</h2>
          <hr className="gold-rule" />
          <ul className="highlight-list">
            {product.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {product.description ? (
        <section className="section-tight">
          <h2 className="h2">عن الصنف</h2>
          <hr className="gold-rule" />
          <p className="lede">{product.description}</p>
        </section>
      ) : null}

      {product.specGroups && product.specGroups.length > 0 ? (
        <section className="section-tight">
          <h2 className="h2">المواصفات</h2>
          <hr className="gold-rule" />
          {product.specGroups.map((group) => {
            const open = openSpec === group.title;
            return (
              <div key={group.title} className="spec">
                <button
                  type="button"
                  className="spec-head"
                  onClick={() => setOpenSpec(open ? null : group.title)}
                  aria-expanded={open}
                >
                  <span>{group.title}</span>
                  <span aria-hidden="true">{open ? '−' : '+'}</span>
                </button>
                {open ? (
                  <dl className="spec-body">
                    {group.specs.map((spec) => (
                      <div key={spec.label} className="spec-line">
                        <dt>{spec.label}</dt>
                        <dd>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="section-tight">
          <h2 className="h2">أصناف ذات صلة</h2>
          <hr className="gold-rule" />
          <div className="rail">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
