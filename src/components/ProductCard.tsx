import { Link } from 'react-router-dom';

import { Product } from '../domain/entities';
import { useWishlistStore } from '../store/stores';
import { formatCompactCount } from '../utils/format';
import { Price, Stars, useToastStore } from './bits';

export function ProductCard({ product }: { product: Product }) {
  const saved = useWishlistStore((s) => s.ids.includes(product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const showToast = useToastStore((s) => s.show);

  const dealActive =
    product.flashDeal && new Date(product.flashDeal.endsAt).getTime() > Date.now();

  return (
    <article className="card">
      <Link to={`/product/${product.id}`} aria-label={product.name}>
        <div className="card-media">
          <img src={product.images[0]} alt={product.name} loading="lazy" />
          <div className="card-badges">
            {product.isNew ? <span className="pill pill-new">جديد</span> : null}
            {dealActive ? (
              <span className="pill pill-deal">-{product.flashDeal!.percentOff}%</span>
            ) : null}
          </div>
        </div>
      </Link>
      <button
        className={`card-heart${saved ? ' saved' : ''}`}
        aria-label={saved ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'}
        onClick={() => {
          toggle(product.id);
          showToast(saved ? 'تمت الإزالة من المفضلة' : '♥ أُضيف إلى المفضلة');
        }}
      >
        {saved ? '♥' : '♡'}
      </button>
      <Link to={`/product/${product.id}`}>
        <div className="card-body">
          <div className="card-brand">{product.brand}</div>
          <h3 className="card-name">{product.name}</h3>
          <div className="card-rating">
            <Stars rating={product.rating} />
            <span>
              {product.rating} ({formatCompactCount(product.reviewCount)})
            </span>
          </div>
          <Price product={product} />
        </div>
      </Link>
    </article>
  );
}
