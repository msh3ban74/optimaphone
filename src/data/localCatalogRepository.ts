import { Brand, Category, Coupon, Product } from '../domain/entities';
import { CatalogRepository, ProductQuery } from '../domain/repositories';
import { BRANDS, CATEGORIES, COUPONS, PRODUCTS } from './catalog';

function minPriceOf(p: Product): number {
  return Math.min(...p.variants.map((v) => v.price));
}

function hasStock(p: Product): boolean {
  return p.variants.some((v) => v.stock > 0);
}

function relevanceScore(p: Product, terms: string[]): number {
  const haystacks: Array<[string, number]> = [
    [p.name.toLowerCase(), 6],
    [p.tagline.toLowerCase(), 3],
    [p.tags.join(' ').toLowerCase(), 3],
    [p.brand, 2],
    [p.category, 2],
    [p.description.toLowerCase(), 1],
  ];
  let score = 0;
  for (const term of terms) {
    for (const [hay, weight] of haystacks) {
      if (hay.includes(term)) score += weight;
    }
  }
  return score;
}

class LocalCatalogRepository implements CatalogRepository {
  getAll(): Product[] {
    return PRODUCTS;
  }

  getById(id: string): Product | undefined {
    return PRODUCTS.find((p) => p.id === id);
  }

  getCategories(): Category[] {
    return CATEGORIES;
  }

  getBrands(): Brand[] {
    return BRANDS;
  }

  query(q: ProductQuery): Product[] {
    let results = PRODUCTS.slice();

    if (q.category) results = results.filter((p) => p.category === q.category);
    if (q.brand) results = results.filter((p) => p.brand === q.brand);
    if (q.minPrice !== undefined) results = results.filter((p) => minPriceOf(p) >= q.minPrice!);
    if (q.maxPrice !== undefined) results = results.filter((p) => minPriceOf(p) <= q.maxPrice!);
    if (q.inStockOnly) results = results.filter(hasStock);

    const terms = (q.text ?? '')
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);

    if (terms.length > 0) {
      results = results
        .map((p) => ({ p, score: relevanceScore(p, terms) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.p);
    }

    switch (q.sort) {
      case 'price-asc':
        results.sort((a, b) => minPriceOf(a) - minPriceOf(b));
        break;
      case 'price-desc':
        results.sort((a, b) => minPriceOf(b) - minPriceOf(a));
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        results.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
        break;
      default:
        break;
    }

    return results;
  }

  getFeatured(): Product[] {
    return PRODUCTS.filter((p) => p.isFeatured);
  }

  getNewLaunches(): Product[] {
    return PRODUCTS.filter((p) => p.isNew);
  }

  getFlashDeals(): Product[] {
    const now = Date.now();
    return PRODUCTS.filter(
      (p) => p.flashDeal && new Date(p.flashDeal.endsAt).getTime() > now,
    );
  }

  getTrending(): Product[] {
    return PRODUCTS.slice()
      .sort((a, b) => b.reviewCount * b.rating - a.reviewCount * a.rating)
      .slice(0, 8);
  }

  getRelated(productId: string, limit = 6): Product[] {
    const target = this.getById(productId);
    if (!target) return [];
    return PRODUCTS.filter((p) => p.id !== productId)
      .map((p) => {
        let score = 0;
        if (p.category === target.category) score += 4;
        if (p.brand === target.brand) score += 2;
        score += p.tags.filter((t) => target.tags.includes(t)).length;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.p);
  }

  findCoupon(code: string): Coupon | undefined {
    return COUPONS.find((c) => c.code === code.trim().toUpperCase());
  }
}

/** Singleton catalog access point for the whole app. */
export const catalog: CatalogRepository = new LocalCatalogRepository();
