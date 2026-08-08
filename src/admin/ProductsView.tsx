import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ProductImage, useToastStore } from '../components/bits';
import { useStoreData } from '../data/storeData';
import { formatNumber, formatPrice } from '../utils/format';

/** قائمة الأصناف: بحث وفرز ومخزون وإجراءات سريعة. */
export function ProductsView() {
  const navigate = useNavigate();
  const products = useStoreData((s) => s.products);
  const removeProduct = useStoreData((s) => s.removeProduct);
  const duplicateProduct = useStoreData((s) => s.duplicateProduct);
  const saveProduct = useStoreData((s) => s.saveProduct);
  const threshold = useStoreData((s) => s.settings.lowStockThreshold);
  const notify = useToastStore((s) => s.show);

  const [text, setText] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = text.trim().toLowerCase();
    const list = term
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.brandName.toLowerCase().includes(term) ||
            p.id.toLowerCase().includes(term),
        )
      : products;

    return list.map((p) => {
      const stock = p.variants.reduce((s, v) => s + v.stock, 0);
      const prices = p.variants.map((v) => v.price);
      return {
        product: p,
        stock,
        from: prices.length > 0 ? Math.min(...prices) : 0,
      };
    });
  }, [products, text]);

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="ابحث بالاسم أو العلامة"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="بحث في الأصناف"
        />
        <Link to="/admin/products/new" className="btn btn-gold">
          صنف جديد
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="admin-panel center-text stack-sm">
          <p className="h3">لا توجد أصناف بعد</p>
          <p className="muted small">
            أضف أول صنف ليظهر في المتجر مباشرة.
          </p>
          <div>
            <Link to="/admin/products/new" className="btn btn-gold">
              أضف أول صنف
            </Link>
          </div>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>الصنف</th>
                <th>الفئة</th>
                <th>السعر من</th>
                <th>المخزون</th>
                <th>الواجهة</th>
                <th aria-label="إجراءات" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ product, stock, from }) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-cell-product">
                      <div className="admin-thumb">
                        <ProductImage src={product.images[0]} alt={product.name} />
                      </div>
                      <div>
                        <Link to={`/admin/products/${product.id}`} className="strong">
                          {product.name}
                        </Link>
                        <div className="faint small">{product.brandName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="small">{product.categoryName}</td>
                  <td className="tnum">{formatPrice(from)}</td>
                  <td>
                    <span
                      className={
                        stock === 0
                          ? 'pill tone-bad'
                          : stock <= threshold
                            ? 'pill tone-warn'
                            : 'pill tone-good'
                      }
                    >
                      {stock === 0 ? 'نفد' : formatNumber(stock)}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={product.featured ? 'toggle on' : 'toggle'}
                      onClick={() => saveProduct({ ...product, featured: !product.featured })}
                      aria-pressed={product.featured ?? false}
                      aria-label="إظهار في الواجهة"
                    >
                      <i />
                    </button>
                  </td>
                  <td className="admin-row-actions">
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => {
                        const id = duplicateProduct(product.id);
                        if (id) {
                          notify('نُسخ الصنف');
                          navigate(`/admin/products/${id}`);
                        }
                      }}
                    >
                      نسخ
                    </button>
                    {confirmId === product.id ? (
                      <>
                        <button
                          type="button"
                          className="text-btn danger"
                          onClick={() => {
                            removeProduct(product.id);
                            setConfirmId(null);
                            notify('حُذف الصنف');
                          }}
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          type="button"
                          className="text-btn"
                          onClick={() => setConfirmId(null)}
                        >
                          تراجع
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="text-btn danger"
                        onClick={() => setConfirmId(product.id)}
                      >
                        حذف
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
