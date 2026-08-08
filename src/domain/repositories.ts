import type { Brand, BrandId, Category, CategoryId, Product } from './entities';

export interface ProductQuery {
  text?: string;
  category?: CategoryId;
  brand?: BrandId;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: 'relevance' | 'price-asc' | 'price-desc' | 'newest';
}

/**
 * عقد الوصول إلى الكتالوج. لا تتعامل الواجهة إلا مع هذه الواجهة
 * البرمجية، فيمكن استبدال المصدر المحلي بخدمة عن بُعد دون تعديل
 * أي شاشة.
 */
export interface CatalogRepository {
  getAll(): Product[];
  getById(id: string): Product | undefined;
  getCategories(): Category[];
  getBrands(): Brand[];
  query(q: ProductQuery): Product[];
  getFeatured(): Product[];
  getRelated(productId: string, limit?: number): Product[];
  isEmpty(): boolean;
}
