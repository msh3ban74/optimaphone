import { Link } from 'react-router-dom';

import { EmptyState, Reveal } from '../components/bits';
import { Hero } from '../components/Hero';
import { MagneticAnchor } from '../components/Magnetic';
import { PinnedStatements } from '../components/PinnedStatements';
import { ProductCard } from '../components/ProductCard';
import { STORE } from '../config/store';
import { useCatalog } from '../data/localCatalogRepository';

const ASSURANCES = [
  {
    mark: '◈',
    title: 'أجهزةٌ أصلية',
    body: 'كل صنفٍ يصلك بضمانه المعتمد وبكامل ملحقاته.',
  },
  {
    mark: '◆',
    title: 'سدادٌ يُناسبك',
    body: 'إنستاباي أو محفظةٌ إلكترونية أو نقدًا عند الاستلام.',
  },
  {
    mark: '❖',
    title: 'خصوصيةٌ محفوظة',
    body: 'لا حساباتٍ ولا تتبّع، وبياناتك لا تغادر جهازك.',
  },
];

export function HomePage() {
  const catalog = useCatalog();
  const empty = catalog.isEmpty();
  const featured = catalog.getFeatured();
  const categories = catalog.getCategories();
  const showcase = featured.length > 0 ? featured : catalog.getAll().slice(0, 8);

  return (
    <>
      <Hero />

      <PinnedStatements />

      <div className="wrap">
        {empty ? (
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
        ) : (
          <>
            {categories.length > 0 ? (
              <section className="section-tight">
                <div className="chips-scroll">
                  {categories.map((c) => (
                    <Link key={c.id} to={`/shop?category=${encodeURIComponent(c.id)}`} className="chip">
                      {c.name}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="section">
              <Reveal>
                <div className="section-head">
                  <div>
                    <h2 className="h1">مختارات الدار</h2>
                    <p className="muted small">أصناف نعتز بتقديمها</p>
                  </div>
                  <Link to="/shop" className="link-gold">
                    الكل ←
                  </Link>
                </div>
                <div className="grid">
                  {showcase.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </Reveal>
            </section>
          </>
        )}

        <section className="section">
          <Reveal>
            <div className="assurances">
              {ASSURANCES.map((a) => (
                <article key={a.title} className="assurance">
                  <span className="assurance-mark" aria-hidden="true">
                    {a.mark}
                  </span>
                  <h3 className="h3">{a.title}</h3>
                  <p className="muted small">{a.body}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="section">
          <Reveal>
            <div className="callout">
              <div className="callout-glow" aria-hidden="true" />
              <div className="callout-body">
                <p className="eyebrow">استفسار</p>
                <h2 className="h1">نساعدك في اختيار جهازك</h2>
                <p className="lede">
                  راسِلنا وسنوافيك بالمتوفر وأسعاره وموعد التسليم.
                </p>
              </div>
              <MagneticAnchor
                href={`https://wa.me/${STORE.whatsapp}`}
                className="btn btn-gold btn-lg"
              >
                محادثة واتساب
              </MagneticAnchor>
            </div>
          </Reveal>
        </section>
      </div>
    </>
  );
}
