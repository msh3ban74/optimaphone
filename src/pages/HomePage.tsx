import { Link } from 'react-router-dom';

import { Countdown, Price, Reveal } from '../components/bits';
import { ProductCard } from '../components/ProductCard';
import { catalog } from '../data/localCatalogRepository';
import { Product } from '../domain/entities';
import { useRecentStore } from '../store/stores';

const COLLECTIONS = [
  { title: 'Apple', sub: 'التشكيلة الكاملة', emoji: '', to: '/shop?brand=apple' },
  { title: 'Samsung', sub: 'عالم جالاكسي', emoji: '🌌', to: '/shop?brand=samsung' },
  { title: 'الألعاب', sub: 'قوة RTX', emoji: '🎮', to: '/shop?category=gaming' },
  { title: 'اللابتوبات', sub: 'للعمل والإبداع', emoji: '💻', to: '/shop?category=laptops' },
  { title: 'الصوتيات', sub: 'نقاء وهدوء', emoji: '🎧', to: '/shop?category=audio' },
  { title: 'الساعات', sub: 'على معصمك', emoji: '⌚', to: '/shop?category=wearables' },
];

function Rail({ products }: { products: Product[] }) {
  return (
    <div className="rail">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function HomePage() {
  const hero = catalog.getFeatured()[0] ?? catalog.getAll()[0];
  const flashDeals = catalog.getFlashDeals();
  const newLaunches = catalog.getNewLaunches();
  const trending = catalog.getTrending();
  const recentIds = useRecentStore((s) => s.productIds);
  const recent = recentIds
    .map((id) => catalog.getById(id))
    .filter((p): p is Product => p !== undefined);

  const firstDeal = flashDeals[0];

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bloom" />
        <div className="container hero-inner">
          <div>
            <div className="hero-kicker">OPTIMAPHONE — متجر التقنية الفاخر</div>
            <h1 className="hero-title">{hero.name}</h1>
            <p className="hero-sub">{hero.tagline} — أحدث إصدارات التقنية بضمان رسمي وشحن مجاني للطلبات فوق $200.</p>
            <div className="hero-cta">
              <Link to={`/product/${hero.id}`} className="btn btn-gold">
                اكتشف المنتج الرائد
              </Link>
              <Link to="/shop" className="btn btn-ghost">
                تصفّح المتجر
              </Link>
            </div>
          </div>
          <Link to={`/product/${hero.id}`} className="hero-card" aria-label={hero.name}>
            <img src={hero.images[0]} alt={hero.name} />
            <div className="hero-card-body">
              <span style={{ color: 'var(--text-dim)' }}>يبدأ من</span>
              <Price product={hero} large />
            </div>
          </Link>
        </div>
      </section>

      <div className="container">
        {/* Flash deals */}
        {flashDeals.length > 0 ? (
          <section className="section">
            <Reveal>
              <div className="section-head">
                <div>
                  <h2 className="section-title">⚡ عروض فلاش</h2>
                  <p className="section-sub">
                    الأسعار ترجع لطبيعتها عند انتهاء العدّاد
                    {firstDeal?.flashDeal ? (
                      <>
                        {' — '}
                        <Countdown endsAt={firstDeal.flashDeal.endsAt} />
                      </>
                    ) : null}
                  </p>
                </div>
                <Link to="/shop?deal=1" className="section-link">
                  كل العروض ←
                </Link>
              </div>
              <Rail products={flashDeals} />
            </Reveal>
          </section>
        ) : null}

        {/* New launches */}
        <section className="section">
          <Reveal>
            <div className="section-head">
              <div>
                <h2 className="section-title">وصل حديثًا</h2>
                <p className="section-sub">مباشرةً من منصّة الإطلاق</p>
              </div>
              <Link to="/shop?sort=newest" className="section-link">
                عرض الكل ←
              </Link>
            </div>
            <Rail products={newLaunches} />
          </Reveal>
        </section>

        {/* Collections */}
        <section className="section">
          <Reveal>
            <div className="section-head">
              <div>
                <h2 className="section-title">التشكيلات</h2>
                <p className="section-sub">عوالم منسّقة بعناية</p>
              </div>
            </div>
            <div className="collections">
              {COLLECTIONS.map((c, i) => (
                <Reveal key={c.title} delay={i * 60}>
                  <Link to={c.to} className="collection" style={{ display: 'block' }}>
                    <span className="emoji">{c.emoji}</span>
                    <h3>{c.title}</h3>
                    <p>{c.sub}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Trending */}
        <section className="section">
          <Reveal>
            <div className="section-head">
              <div>
                <h2 className="section-title">الأكثر رواجًا</h2>
                <p className="section-sub">ما يشتريه الجميع الآن</p>
              </div>
              <Link to="/shop?sort=rating" className="section-link">
                عرض الكل ←
              </Link>
            </div>
            <Rail products={trending} />
          </Reveal>
        </section>

        {/* Recently viewed */}
        {recent.length > 0 ? (
          <section className="section">
            <Reveal>
              <div className="section-head">
                <div>
                  <h2 className="section-title">شاهدتها مؤخرًا</h2>
                  <p className="section-sub">أكمل من حيث توقفت</p>
                </div>
              </div>
              <Rail products={recent} />
            </Reveal>
          </section>
        ) : null}
      </div>
    </>
  );
}
