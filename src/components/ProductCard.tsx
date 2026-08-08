import { Link } from 'react-router-dom';

import type { Product } from '../domain/entities';
import { useCartStore, useWishlistStore } from '../store/stores';
import { Price, ProductImage, cheapestVariant, useToastStore } from './bits';

export function ProductCard({ product }: { product: Product }) {
  const saved = useWishlistStore((s) => s.ids.includes(product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.add);
  const notify = useToastStore((s) => s.show);

  const variant = cheapestVariant(product);
  const soldOut = product.variants.every((v) => v.stock <= 0);

  /** إضافةٌ سريعة بأقل سعرٍ متاح، دون مغادرة الصفحة. */
  const quickAdd = () => {
    const target = product.variants.find((v) => v.stock > 0) ?? variant;
    if (!target) return;
    addToCart(product.id, target.id);
    notify('أُضيف إلى السلة');
  };

  return (
    <article className="card">
      <div className="card-media">
        <Link to={`/product/${product.id}`} aria-label={product.name}>
          <ProductImage src={product.images[0]} alt={product.name} />
        </Link>
        {soldOut ? <span className="tag tag-bad">نفدت الكمية</span> : null}
        <button
          type="button"
          className={saved ? 'heart on' : 'heart'}
          aria-pressed={saved}
          aria-label={saved ? 'إزالة من المختارات' : 'إضافة إلى المختارات'}
          onClick={() => {
            toggle(product.id);
            notify(saved ? 'أُزيل من المختارات' : 'أُضيف إلى المختارات');
          }}
        >
          {saved ? '♥' : '♡'}
        </button>

        {!soldOut ? (
          <button type="button" className="card-quick" onClick={quickAdd}>
            إضافةٌ سريعة
          </button>
        ) : null}
      </div>

      <Link to={`/product/${product.id}`} className="card-body">
        <span className="card-brand">{product.brandName}</span>
        <h3 className="h3 truncate">{product.name}</h3>
        {product.tagline ? <p className="faint truncate">{product.tagline}</p> : null}
        <Price variant={variant} />
      </Link>
    </article>
  );
}
