import { useMemo } from 'react';

import type { Brand, Category, Product } from '../domain/entities';
import type { CatalogRepository, ProductQuery } from '../domain/repositories';
import { currentProducts, useStoreData } from './storeData';

function minPriceOf(p: Product): number {
  if (p.variants.length === 0) return 0;
  return Math.min(...p.variants.map((v) => v.price));
}

function hasStock(p: Product): boolean {
  return p.variants.some((v) => v.stock > 0);
}

function relevanceScore(p: Product, terms: string[]): number {
  const haystacks: Array<[string, number]> = [
    [p.name.toLowerCase(), 6],
    [(p.tagline ?? '').toLowerCase(), 3],
    [p.brandName.toLowerCase(), 3],
    [p.categoryName.toLowerCase(), 2],
    [(p.description ?? '').toLowerCase(), 1],
  ];
  let score = 0;
  for (const term of terms) {
    for (const [hay, weight] of haystacks) {
      if (hay.includes(term)) score += weight;
    }
  }
  return score;
}

/**
 * كتالوج محلي يقرأ من ملف البضاعة. التصنيفات والعلامات التجارية
 * تُشتق من الأصناف الموجودة فعلًا، فلا تظهر فئة فارغة أبدًا.
 */
class LocalCatalogRepository implements CatalogRepository {
  getAll(): Product[] {
    return currentProducts();
  }

  getById(id: string): Product | undefined {
    return this.getAll().find((p) => p.id === id);
  }

  getCategories(): Category[] {
    const seen = new Map<string, Category>();
    for (const p of this.getAll()) {
      if (!seen.has(p.category)) {
        seen.set(p.category, { id: p.category, name: p.categoryName });
      }
    }
    return [...seen.values()];
  }

  getBrands(): Brand[] {
    const seen = new Map<string, Brand>();
    for (const p of this.getAll()) {
      if (!seen.has(p.brand)) {
        seen.set(p.brand, { id: p.brand, name: p.brandName });
      }
    }
    return [...seen.values()];
  }

  query(q: ProductQuery): Product[] {
    let results = this.getAll().slice();

    if (q.category) results = results.filter((p) => p.category === q.category);
    if (q.brand) results = results.filter((p) => p.brand === q.brand);
    if (q.minPrice !== undefined) {
      const min = q.minPrice;
      results = results.filter((p) => minPriceOf(p) >= min);
    }
    if (q.maxPrice !== undefined) {
      const max = q.maxPrice;
      results = results.filter((p) => minPriceOf(p) <= max);
    }
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
      case 'newest':
        results.reverse();
        break;
      default:
        break;
    }

    return results;
  }

  getFeatured(): Product[] {
    return this.getAll().filter((p) => p.featured);
  }

  getRelated(productId: string, limit = 4): Product[] {
    const target = this.getById(productId);
    if (!target) return [];
    return this.getAll().filter((p) => p.id !== productId)
      .map((p) => {
        let score = 0;
        if (p.category === target.category) score += 4;
        if (p.brand === target.brand) score += 2;
        return { p, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.p);
  }

  isEmpty(): boolean {
    return this.getAll().length === 0;
  }
}

/** نقطة الوصول الوحيدة إلى الكتالوج. */
export const catalog: CatalogRepository = new LocalCatalogRepository();

/**
 * الكتالوج ذاته، مع اشتراكٍ في مصدر البيانات، تستعمله الشاشات كي
 * يُعاد عرضها فور تعديل التاجر للأصناف من لوحة الإدارة.
 *
 * تتبدّل هوية القيمة المعادة كلما تبدّلت الأصناف — الكائن الجديد
 * يرث الكتالوج نفسه فيسلك سلوكه تمامًا — فتُعاد الحسابات المخزَّنة
 * في `useMemo` بوضع الكتالوج ضمن اعتمادياتها. لولا ذلك لظلّت
 * الشاشة تعرض نتيجةً محسوبة على أصنافٍ قديمة.
 */
export function useCatalog(): CatalogRepository {
  const products = useStoreData((s) => s.products);
  // الاعتمادية مقصودة وإن لم يستعملها الجسم: هي وحدها ما يجدّد الهوية.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => Object.create(catalog) as CatalogRepository, [products]);
}
