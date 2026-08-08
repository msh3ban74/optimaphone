import { Link } from 'react-router-dom';

import { EmptyState } from '../components/bits';
import { ProductCard } from '../components/ProductCard';
import { useCatalog } from '../data/localCatalogRepository';
import type { Product } from '../domain/entities';
import { useWishlistStore } from '../store/stores';

export function WishlistPage() {
  const catalog = useCatalog();
  const ids = useWishlistStore((s) => s.ids);
  const products = ids
    .map((id) => catalog.getById(id))
    .filter((p): p is Product => p !== undefined);

  if (products.length === 0) {
    return (
      <div className="wrap">
        <EmptyState
          mark="♡"
          title="لا مختارات بعد"
          body="كل صنف يُحفظ هنا يبقى في انتظارك."
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
    <div className="wrap section-tight">
      <div className="section-head">
        <div>
          <h1 className="h1">المختارات</h1>
          <p className="muted small tnum">{products.length} صنف</p>
        </div>
      </div>
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
