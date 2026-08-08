import { Link } from 'react-router-dom';

import { Reveal } from '../components/bits';
import { ProductCard } from '../components/ProductCard';
import { catalog } from '../data/localCatalogRepository';
import { Product } from '../domain/entities';
import { useWishlistStore } from '../store/stores';

export function WishlistPage() {
  const ids = useWishlistStore((s) => s.ids);
  const products = ids
    .map((id) => catalog.getById(id))
    .filter((p): p is Product => p !== undefined);

  if (products.length === 0) {
    return (
      <div className="container empty">
        <div className="icon">♡</div>
        <h2>مفيش حاجة في المفضلة لسه</h2>
        <p>دوس على القلب في أي منتج وهيستناك هنا.</p>
        <Link to="/shop" className="btn btn-gold">
          دوّر على حاجة تعجبك
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock: '2.4rem' }}>
      <div className="section-head">
        <div>
          <h1 className="section-title">المفضلة ♥</h1>
          <p className="section-sub">{products.length} منتج محفوظ</p>
        </div>
      </div>
      <div className="grid">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i, 8) * 45}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
