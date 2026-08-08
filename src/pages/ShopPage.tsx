import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Reveal } from '../components/bits';
import { ProductCard } from '../components/ProductCard';
import { catalog } from '../data/localCatalogRepository';
import { BrandId, CategoryId } from '../domain/entities';
import { ProductQuery } from '../domain/repositories';

const CATEGORY_LABELS: Record<CategoryId, string> = {
  phones: 'موبايلات',
  laptops: 'لابتوبات',
  tablets: 'تابلت',
  audio: 'صوتيات',
  wearables: 'ساعات',
  gaming: 'ألعاب',
  accessories: 'إكسسوارات',
};

const SORTS: Array<{ key: NonNullable<ProductQuery['sort']>; label: string }> = [
  { key: 'relevance', label: 'الأنسب' },
  { key: 'price-asc', label: 'السعر: من الأقل' },
  { key: 'price-desc', label: 'السعر: من الأعلى' },
  { key: 'rating', label: 'الأعلى تقييمًا' },
  { key: 'newest', label: 'الأحدث' },
];

const PRICE_BANDS = [
  { label: 'أقل من $500', min: undefined as number | undefined, max: 500 as number | undefined },
  { label: '$500 – $1000', min: 500, max: 1000 },
  { label: '$1000 – $2000', min: 1000, max: 2000 },
  { label: 'أكثر من $2000', min: 2000, max: undefined },
];

export function ShopPage() {
  const [params, setParams] = useSearchParams();

  const text = params.get('q') ?? '';
  const category = (params.get('category') as CategoryId | null) ?? undefined;
  const brand = (params.get('brand') as BrandId | null) ?? undefined;
  const dealOnly = params.get('deal') === '1';
  const bandIndex = params.get('band') !== null ? Number(params.get('band')) : undefined;
  const sort = (params.get('sort') as ProductQuery['sort']) ?? 'relevance';

  const set = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (value === undefined || value === '') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const products = useMemo(() => {
    const band = bandIndex !== undefined ? PRICE_BANDS[bandIndex] : undefined;
    let results = catalog.query({
      text: text.trim() || undefined,
      category,
      brand,
      minPrice: band?.min,
      maxPrice: band?.max,
      sort,
    });
    if (dealOnly) {
      const dealIds = new Set(catalog.getFlashDeals().map((p) => p.id));
      results = results.filter((p) => dealIds.has(p.id));
    }
    return results;
  }, [text, category, brand, bandIndex, sort, dealOnly]);

  return (
    <div className="container shop-layout">
      {/* Filters */}
      <aside className="filters">
        <div className="searchbar">
          <span>🔍</span>
          <input
            value={text}
            onChange={(e) => set('q', e.target.value)}
            placeholder="ابحث عن منتج…"
            aria-label="بحث"
          />
        </div>

        <div className="filter-group">
          <h4>الفئة</h4>
          <div className="chips">
            {catalog.getCategories().map((c) => (
              <button
                key={c.id}
                className={`chip${category === c.id ? ' active' : ''}`}
                onClick={() => set('category', category === c.id ? undefined : c.id)}
              >
                {c.icon} {CATEGORY_LABELS[c.id]}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4>الماركة</h4>
          <div className="chips">
            {catalog.getBrands().map((b) => (
              <button
                key={b.id}
                className={`chip${brand === b.id ? ' active' : ''}`}
                onClick={() => set('brand', brand === b.id ? undefined : b.id)}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4>السعر</h4>
          <div className="chips">
            {PRICE_BANDS.map((band, i) => (
              <button
                key={band.label}
                className={`chip${bandIndex === i ? ' active' : ''}`}
                onClick={() => set('band', bandIndex === i ? undefined : String(i))}
              >
                {band.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4>عروض</h4>
          <div className="chips">
            <button
              className={`chip${dealOnly ? ' active' : ''}`}
              onClick={() => set('deal', dealOnly ? undefined : '1')}
            >
              ⚡ عروض فلاش فقط
            </button>
          </div>
        </div>
      </aside>

      {/* Results */}
      <section>
        <div className="section-head">
          <div>
            <h1 className="section-title">
              {dealOnly ? '⚡ عروض فلاش' : brand ? catalog.getBrands().find((b) => b.id === brand)?.name : category ? CATEGORY_LABELS[category] : 'المتجر'}
            </h1>
            <p className="section-sub">{products.length} منتج</p>
          </div>
        </div>

        <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.2rem' }}>
          {SORTS.map((s) => (
            <button
              key={s.key}
              className={`chip${sort === s.key ? ' active' : ''}`}
              onClick={() => set('sort', s.key === 'relevance' ? undefined : s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="empty">
            <div className="icon">🛰️</div>
            <h2>لا توجد نتائج</h2>
            <p>جرّب كلمة مختلفة أو خفف الفلاتر — الكتالوج مليء بالمفاجآت.</p>
          </div>
        ) : (
          <div className="grid">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 8) * 45}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
