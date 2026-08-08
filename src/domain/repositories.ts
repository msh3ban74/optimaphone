import {
  Brand,
  BrandId,
  Category,
  CategoryId,
  Coupon,
  Product,
} from './entities';

export interface ProductQuery {
  text?: string;
  category?: CategoryId;
  brand?: BrandId;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

/**
 * Catalog access contract. The app only talks to this interface; the
 * current implementation is a seeded in-memory catalog, and a REST/
 * GraphQL implementation can be swapped in without touching a screen.
 */
export interface CatalogRepository {
  getAll(): Product[];
  getById(id: string): Product | undefined;
  getCategories(): Category[];
  getBrands(): Brand[];
  query(q: ProductQuery): Product[];
  getFeatured(): Product[];
  getNewLaunches(): Product[];
  getFlashDeals(): Product[];
  getTrending(): Product[];
  getRelated(productId: string, limit?: number): Product[];
  findCoupon(code: string): Coupon | undefined;
}
