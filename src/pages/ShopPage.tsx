import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { EmptyState } from '../components/bits';
import { ProductCard } from '../components/ProductCard';
import { STORE } from '../config/store';
import { useCatalog } from '../data/localCatalogRepository';
import type { ProductQuery } from '../domain/repositories';
import { sanitizeText } from '../utils/security';

const SORTS: Array<{ key: NonNullable<ProductQuery['sort']>; label: string }> = [
  { key: 'relevance', label: 'الأنسب' },
  { key: 'price-asc', label: 'الأقل سعرًا' },
  { key: 'price-desc', label: 'الأعلى سعرًا' },
  { key: 'newest', label: 'الأحدث' },
];

export function ShopPage() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();

  const text = sanitizeText(params.get('q') ?? '', 60);
  const category = params.get('category') ?? undefined;
  const brand = params.get('brand') ?? undefined;
  const inStockOnly = params.get('stock') === '1';
  const sort = (params.get('sort') as ProductQuery['sort']) ?? 'relevance';

  const set = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (value === undefined || value === '') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const categories = catalog.getCategories();
  const brands = catalog.getBrands();

  const products = useMemo(
    () => catalog.query({ text: text || undefined, category, brand, inStockOnly, sort }),
    [catalog, text, category, brand, inStockOnly, sort],
  );

  if (catalog.isEmpty()) {
    return (
      <div className="wrap">
        <EmptyState
          mark="◈"
          title="المعروضات قيد التحديث"
          body="يجري الآن اعتماد الأصناف الجديدة. تسعدنا مراسلتك للاستفسار عن أي جهاز."
          action={
            <a
              href={`https://wa.me/${STORE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold"
            >
              استفسر عبر واتساب
            </a>
          }
        />
      </div>
    );
  }

  const heading =
    brands.find((b) => b.id === brand)?.name ??
    categories.find((c) => c.id === category)?.name ??
    'المعروضات';

  return (
    <div className="wrap shop">
      <aside className="filters">
        <div className="search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={text}
            onChange={(e) => set('q', sanitizeText(e.target.value, 60))}
            placeholder="ابحث في المعروضات"
            aria-label="البحث في المعروضات"
            maxLength={60}
          />
        </div>

        {categories.length > 0 ? (
          <div>
            <h2 className="filter-title">الفئة</h2>
            <div className="chips">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={category === c.id ? 'chip on' : 'chip'}
                  onClick={() => set('category', category === c.id ? undefined : c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {brands.length > 0 ? (
          <div>
            <h2 className="filter-title">العلامة</h2>
            <div className="chips">
              {brands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={brand === b.id ? 'chip on' : 'chip'}
                  onClick={() => set('brand', brand === b.id ? undefined : b.id)}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h2 className="filter-title">التوفر</h2>
          <div className="chips">
            <button
              type="button"
              className={inStockOnly ? 'chip on' : 'chip'}
              onClick={() => set('stock', inStockOnly ? undefined : '1')}
            >
              المتوفر فحسب
            </button>
          </div>
        </div>
      </aside>

      <section>
        <div className="section-head">
          <div>
            <h1 className="h1">{heading}</h1>
            <p className="muted small tnum">{products.length} صنف</p>
          </div>
        </div>

        <div className="chips">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={sort === s.key ? 'chip on' : 'chip'}
              onClick={() => set('sort', s.key === 'relevance' ? undefined : s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {products.length === 0 ? (
          <EmptyState
            mark="⌕"
            title="لا نتائج مطابقة"
            body="جرّب لفظًا آخر أو خفّف شروط التصفية."
            action={
              <Link to="/shop" className="btn btn-quiet">
                عرض الكل
              </Link>
            }
          />
        ) : (
          <div className="grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
