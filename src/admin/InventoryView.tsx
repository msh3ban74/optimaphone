import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useToastStore } from '../components/bits';
import { useStoreData } from '../data/storeData';
import type { Product } from '../domain/entities';
import { formatNumber, formatPrice, variantLabel } from '../utils/format';

/**
 * المخزون: كل الخيارات في شاشة واحدة، تُعدَّل كمياتها وأسعارها
 * دون الدخول إلى كل صنف على حدة. ومعها تعديل جماعي للأسعار.
 */
export function InventoryView() {
  const products = useStoreData((s) => s.products);
  const saveProduct = useStoreData((s) => s.saveProduct);
  const threshold = useStoreData((s) => s.settings.lowStockThreshold);
  const notify = useToastStore((s) => s.show);

  const [text, setText] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [bulkPercent, setBulkPercent] = useState('');
  const [bulkScope, setBulkScope] = useState('all');

  const rows = useMemo(() => {
    const term = text.trim().toLowerCase();
    return products.flatMap((p) =>
      p.variants
        .filter((v) => (onlyLow ? v.stock <= threshold : true))
        .filter((v) =>
          term
            ? p.name.toLowerCase().includes(term) ||
              (v.storage ?? '').toLowerCase().includes(term) ||
              (v.color?.name ?? '').toLowerCase().includes(term)
            : true,
        )
        .map((v) => ({ product: p, variant: v })),
    );
  }, [products, text, onlyLow, threshold]);

  const totals = useMemo(
    () => ({
      units: products.reduce((s, p) => s + p.variants.reduce((n, v) => n + v.stock, 0), 0),
      value: products.reduce(
        (s, p) => s + p.variants.reduce((n, v) => n + v.stock * v.price, 0),
        0,
      ),
      out: products.reduce(
        (s, p) => s + p.variants.filter((v) => v.stock === 0).length,
        0,
      ),
    }),
    [products],
  );

  const setVariant = (product: Product, variantId: string, changes: Record<string, number>) => {
    saveProduct({
      ...product,
      variants: product.variants.map((v) => (v.id === variantId ? { ...v, ...changes } : v)),
    });
  };

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) seen.set(p.category, p.categoryName);
    return [...seen.entries()];
  }, [products]);

  const applyBulk = () => {
    const percent = Number(bulkPercent);
    if (!Number.isFinite(percent) || percent === 0) {
      notify('أدخل نسبة غير صفرية');
      return;
    }

    let touched = 0;
    for (const p of products) {
      if (bulkScope !== 'all' && p.category !== bulkScope) continue;
      touched += 1;
      saveProduct({
        ...p,
        variants: p.variants.map((v) => ({
          ...v,
          price: Math.max(1, Math.round(v.price * (1 + percent / 100))),
        })),
      });
    }

    setBulkPercent('');
    notify(`عُدّل سعر ${formatNumber(touched)} صنف`);
  };

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <div>
          <h1 className="h2">المخزون</h1>
          <p className="small muted">
            {formatNumber(totals.units)} قطعة بقيمة {formatPrice(totals.value)}
            {totals.out > 0 ? ` · ${formatNumber(totals.out)} خيار نافد` : ''}
          </p>
        </div>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="ابحث بالاسم أو السعة أو اللون"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="بحث في المخزون"
        />
        <button
          type="button"
          className={onlyLow ? 'chip on' : 'chip'}
          onClick={() => setOnlyLow((v) => !v)}
          aria-pressed={onlyLow}
        >
          على الوشك فقط
        </button>
      </div>

      {products.length === 0 ? (
        <div className="admin-panel center-text stack-sm">
          <p className="h3">لا أصناف بعد</p>
          <Link to="/admin/products/new" className="btn btn-gold">
            أضف أول صنف
          </Link>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th>الخيار</th>
                  <th>السعر</th>
                  <th>قبل الخصم</th>
                  <th>الكمية</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ product, variant }) => (
                  <tr key={`${product.id}-${variant.id}`}>
                    <td>
                      <Link to={`/admin/products/${product.id}`}>{product.name}</Link>
                    </td>
                    <td className="small faint">
                      {variantLabel([variant.color?.name, variant.storage, variant.ram]) ||
                        'أساسي'}
                    </td>
                    <td>
                      <input
                        className="tnum inline-number"
                        type="number"
                        min={0}
                        value={variant.price}
                        onChange={(e) =>
                          setVariant(product, variant.id, {
                            price: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        aria-label={`سعر ${product.name}`}
                      />
                    </td>
                    <td>
                      <input
                        className="tnum inline-number"
                        type="number"
                        min={0}
                        value={variant.compareAtPrice ?? ''}
                        onChange={(e) =>
                          setVariant(product, variant.id, {
                            compareAtPrice: Number(e.target.value) || 0,
                          })
                        }
                        aria-label={`سعر ${product.name} قبل الخصم`}
                      />
                    </td>
                    <td>
                      <div className="stepper">
                        <button
                          type="button"
                          onClick={() =>
                            setVariant(product, variant.id, {
                              stock: Math.max(0, variant.stock - 1),
                            })
                          }
                          aria-label="إنقاص"
                        >
                          −
                        </button>
                        <input
                          className="tnum"
                          type="number"
                          min={0}
                          value={variant.stock}
                          onChange={(e) =>
                            setVariant(product, variant.id, {
                              stock: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          aria-label={`كمية ${product.name}`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setVariant(product, variant.id, { stock: variant.stock + 1 })
                          }
                          aria-label="زيادة"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          variant.stock === 0
                            ? 'pill tone-bad'
                            : variant.stock <= threshold
                              ? 'pill tone-warn'
                              : 'pill tone-good'
                        }
                      >
                        {variant.stock === 0
                          ? 'نفد'
                          : variant.stock <= threshold
                            ? 'على الوشك'
                            : 'متوفر'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="admin-panel stack-sm">
            <h2 className="h3">تعديل جماعي للأسعار</h2>
            <p className="small muted">
              نسبة موجبة ترفع السعر وسالبة تخفضه. يُطبَّق على كل خيارات الأصناف
              المختارة فورًا، ولا رجعة فيه — نزّل نسخة احتياطية قبله.
            </p>

            <div className="admin-grid-3">
              <div className="field">
                <label htmlFor="b-scope">النطاق</label>
                <select
                  id="b-scope"
                  value={bulkScope}
                  onChange={(e) => setBulkScope(e.target.value)}
                >
                  <option value="all">كل الأصناف</option>
                  {categories.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="b-percent">النسبة %</label>
                <input
                  id="b-percent"
                  className="tnum"
                  type="number"
                  value={bulkPercent}
                  onChange={(e) => setBulkPercent(e.target.value)}
                  placeholder="5 أو 5−"
                />
              </div>

              <div className="field">
                <span className="small muted">&nbsp;</span>
                <button type="button" className="btn btn-quiet" onClick={applyBulk}>
                  تطبيق
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
