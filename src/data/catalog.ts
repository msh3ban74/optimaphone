import type { Product } from '../domain/entities';

/**
 * ── بضاعة المتجر ──────────────────────────────────────────────
 *
 * هذا الملف هو المصدر الوحيد لأصناف المتجر. لا يحتوي على أي بيانات
 * تجريبية أو تقديرية: كل صنف يُضاف هنا يجب أن يكون متوفرًا فعلًا،
 * بسعره الحقيقي وكميته الحقيقية.
 *
 * تُحفظ صور الأصناف داخل مجلد public/products وتُشار إليها بمسار
 * يبدأ بـ '/products/'، فلا يُطلب أي ملف من نطاق خارجي.
 *
 * نموذج صنف مكتمل:
 *
 * {
 *   id: 'iphone-15-pro-max',
 *   name: 'آيفون ١٥ برو ماكس',
 *   tagline: 'هيكل من التيتانيوم',
 *   brand: 'apple',
 *   brandName: 'أبل',
 *   category: 'phones',
 *   categoryName: 'الهواتف',
 *   images: ['/products/iphone-15-pro-max.jpg'],
 *   description: 'وصف الصنف كما هو في الواقع.',
 *   highlights: ['شريحة A17 Pro', 'شاشة 6.7 بوصة'],
 *   specGroups: [
 *     { title: 'الشاشة', specs: [{ label: 'المقاس', value: '6.7 بوصة' }] },
 *   ],
 *   variants: [
 *     {
 *       id: 'v1',
 *       color: { name: 'تيتانيوم طبيعي', hex: '#C8C2B6' },
 *       storage: '256 غيغابايت',
 *       price: 0,
 *       stock: 0,
 *     },
 *   ],
 *   warrantyMonths: 12,
 *   featured: true,
 * }
 */
export const PRODUCTS: Product[] = [];
