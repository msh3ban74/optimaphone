import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ProductImage, useToastStore } from '../components/bits';
import { useStoreData } from '../data/storeData';
import type { Product, ProductVariant, SpecGroup } from '../domain/entities';
import { formatPrice, secureId } from '../utils/format';
import { safeHexColor, sanitizeMultiline, sanitizeText } from '../utils/security';

/** أقصى حجم لصورة مرفوعة، قبل تضمينها في البيانات. */
const MAX_IMAGE_BYTES = 900 * 1024;

function emptyVariant(): ProductVariant {
  return { id: secureId('v'), price: 0, stock: 0 };
}

function emptyProduct(): Product {
  return {
    id: '',
    name: '',
    tagline: '',
    brand: '',
    brandName: '',
    category: '',
    categoryName: '',
    images: [],
    description: '',
    highlights: [],
    specGroups: [],
    variants: [emptyVariant()],
    warrantyMonths: 12,
    featured: false,
  };
}

/** معرّف لاتيني مشتق من الاسم، ويقبل العربية بتحويلها إلى رقم فريد. */
function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s-]/g, '')
    .replace(/\s+/g, '-');
  return /[a-z0-9]/.test(base) ? base : `item-${Date.now().toString(36)}`;
}

export function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToastStore((s) => s.show);

  const products = useStoreData((s) => s.products);
  const saveProduct = useStoreData((s) => s.saveProduct);

  const isNew = id === 'new';
  const existing = useMemo(
    () => (isNew ? undefined : products.find((p) => p.id === id)),
    [products, id, isNew],
  );

  const [draft, setDraft] = useState<Product>(() =>
    existing ? structuredClone(existing) : emptyProduct(),
  );
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) setDraft(structuredClone(existing));
  }, [existing]);

  const knownCategories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) if (p.category) seen.set(p.category, p.categoryName);
    return [...seen.entries()];
  }, [products]);

  const knownBrands = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) if (p.brand) seen.set(p.brand, p.brandName);
    return [...seen.entries()];
  }, [products]);

  if (!isNew && !existing) {
    return (
      <div className="admin-panel center-text stack-sm">
        <p className="h3">لم يُعثر على الصنف</p>
        <button type="button" className="btn btn-quiet" onClick={() => navigate('/admin/products')}>
          رجوع إلى الأصناف
        </button>
      </div>
    );
  }

  const patch = (changes: Partial<Product>) => setDraft((d) => ({ ...d, ...changes }));

  const patchVariant = (index: number, changes: Partial<ProductVariant>) =>
    setDraft((d) => ({
      ...d,
      variants: d.variants.map((v, i) => (i === index ? { ...v, ...changes } : v)),
    }));

  const onPickImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageError(null);

    const encoded: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        setImageError('الصيغ المقبولة: JPG أو PNG أو WEBP.');
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError('اجعل حجم الصورة أقل من 900 كيلوبايت — الصور تُحفَظ داخل المتصفح.');
        continue;
      }
      const dataUrl = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
      if (dataUrl) encoded.push(dataUrl);
    }

    if (encoded.length > 0) patch({ images: [...draft.images, ...encoded].slice(0, 8) });
  };

  const save = () => {
    const name = sanitizeText(draft.name, 90);
    if (name.length < 2) {
      setError('يُرجى إدخال اسم الصنف.');
      return;
    }
    if (draft.variants.length === 0) {
      setError('أضف خيارًا واحدًا على الأقل بسعره وكميته.');
      return;
    }
    if (draft.variants.some((v) => v.price <= 0)) {
      setError('كل خيار يحتاج سعرًا أكبر من صفر.');
      return;
    }

    const finalId = draft.id.trim() || slugify(name);
    const clash = products.some((p) => p.id === finalId && p.id !== existing?.id);
    if (clash) {
      setError('يوجد صنف آخر بهذا المعرّف. غيّره من الحقل المتقدّم.');
      return;
    }

    const clean: Product = {
      ...draft,
      id: finalId,
      name,
      tagline: sanitizeText(draft.tagline ?? '', 120) || undefined,
      brand: draft.brand.trim() || slugify(draft.brandName || 'brand'),
      brandName: sanitizeText(draft.brandName, 60) || 'غير محدّد',
      category: draft.category.trim() || slugify(draft.categoryName || 'category'),
      categoryName: sanitizeText(draft.categoryName, 60) || 'غير مصنّف',
      description: sanitizeMultiline(draft.description ?? '', 1200) || undefined,
      highlights: (draft.highlights ?? [])
        .map((h) => sanitizeText(h, 120))
        .filter((h) => h.length > 0),
      specGroups: (draft.specGroups ?? [])
        .map((g) => ({
          title: sanitizeText(g.title, 60),
          specs: g.specs
            .map((s) => ({
              label: sanitizeText(s.label, 60),
              value: sanitizeText(s.value, 120),
            }))
            .filter((s) => s.label && s.value),
        }))
        .filter((g) => g.title && g.specs.length > 0),
      variants: draft.variants.map((v) => ({
        ...v,
        price: Math.max(0, Math.round(v.price)),
        compareAtPrice:
          v.compareAtPrice && v.compareAtPrice > v.price ? Math.round(v.compareAtPrice) : undefined,
        stock: Math.max(0, Math.round(v.stock)),
        color: v.color ? { name: sanitizeText(v.color.name, 40), hex: safeHexColor(v.color.hex) } : undefined,
        storage: v.storage ? sanitizeText(v.storage, 40) : undefined,
        ram: v.ram ? sanitizeText(v.ram, 40) : undefined,
      })),
    };

    setError(null);
    saveProduct(clean);
    notify(isNew ? 'أُضيف الصنف' : 'حُفظت التعديلات');
    navigate('/admin/products');
  };

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <h1 className="h2">{isNew ? 'صنف جديد' : draft.name || 'تعديل صنف'}</h1>
        <div className="admin-row-actions">
          <button type="button" className="btn btn-quiet" onClick={() => navigate('/admin/products')}>
            إلغاء
          </button>
          <button type="button" className="btn btn-gold" onClick={save}>
            حفظ
          </button>
        </div>
      </div>

      {error ? <p className="field-bad">{error}</p> : null}

      <section className="admin-panel stack-sm">
        <h2 className="h3">الأساسيات</h2>

        <div className="field">
          <label htmlFor="p-name">اسم الصنف</label>
          <input
            id="p-name"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            maxLength={90}
          />
        </div>

        <div className="field">
          <label htmlFor="p-tagline">سطر التعريف</label>
          <input
            id="p-tagline"
            value={draft.tagline ?? ''}
            onChange={(e) => patch({ tagline: e.target.value })}
            maxLength={120}
            placeholder="مثال: هيكل من التيتانيوم"
          />
        </div>

        <div className="admin-grid-2">
          <div className="field">
            <label htmlFor="p-brand">العلامة التجارية</label>
            <input
              id="p-brand"
              list="brands"
              value={draft.brandName}
              onChange={(e) => patch({ brandName: e.target.value, brand: slugify(e.target.value) })}
              maxLength={60}
            />
            <datalist id="brands">
              {knownBrands.map(([bid, bname]) => (
                <option key={bid} value={bname} />
              ))}
            </datalist>
          </div>

          <div className="field">
            <label htmlFor="p-category">الفئة</label>
            <input
              id="p-category"
              list="categories"
              value={draft.categoryName}
              onChange={(e) =>
                patch({ categoryName: e.target.value, category: slugify(e.target.value) })
              }
              maxLength={60}
            />
            <datalist id="categories">
              {knownCategories.map(([cid, cname]) => (
                <option key={cid} value={cname} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="field">
          <label htmlFor="p-desc">الوصف</label>
          <textarea
            id="p-desc"
            value={draft.description ?? ''}
            onChange={(e) => patch({ description: e.target.value })}
            maxLength={1200}
            rows={4}
          />
        </div>

        <div className="admin-grid-2">
          <div className="field">
            <label htmlFor="p-warranty">الضمان بالأشهر</label>
            <input
              id="p-warranty"
              className="tnum"
              type="number"
              min={0}
              max={60}
              value={draft.warrantyMonths ?? 0}
              onChange={(e) => patch({ warrantyMonths: Number(e.target.value) || 0 })}
            />
          </div>

          <div className="field">
            <span className="small muted">الظهور في الواجهة الرئيسية</span>
            <button
              type="button"
              className={draft.featured ? 'toggle on' : 'toggle'}
              onClick={() => patch({ featured: !draft.featured })}
              aria-pressed={draft.featured ?? false}
            >
              <i />
            </button>
          </div>
        </div>
      </section>

      <section className="admin-panel stack-sm">
        <h2 className="h3">الصور</h2>
        <p className="small muted">
          الصورة الأولى هي صورة الغلاف. تُحفَظ الصور المرفوعة داخل المتصفح، فاجعلها
          مضغوطة. للنشر النهائي ضع ملفاتها في <code>public/products</code> واكتب
          مسارها هنا مثل <code>/products/iphone.jpg</code>.
        </p>

        <input
          type="file"
          className="file-input"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => void onPickImages(e.target.files)}
          aria-label="رفع صور"
        />
        {imageError ? <p className="field-bad small">{imageError}</p> : null}

        {draft.images.length > 0 ? (
          <ul className="admin-images">
            {draft.images.map((src, i) => (
              <li key={`${src.slice(0, 24)}-${i}`}>
                <div className="admin-thumb lg">
                  <ProductImage src={src} alt={`صورة ${i + 1}`} />
                </div>
                <div className="admin-image-actions">
                  {i > 0 ? (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => {
                        const images = draft.images.slice();
                        [images[i - 1], images[i]] = [images[i], images[i - 1]];
                        patch({ images });
                      }}
                    >
                      تقديم
                    </button>
                  ) : (
                    <span className="pill tone-good">الغلاف</span>
                  )}
                  <button
                    type="button"
                    className="text-btn danger"
                    onClick={() => patch({ images: draft.images.filter((_, j) => j !== i) })}
                  >
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="field">
          <label htmlFor="p-image-path">إضافة بمسار</label>
          <input
            id="p-image-path"
            className="ltr"
            placeholder="/products/example.jpg"
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              const value = e.currentTarget.value.trim();
              if (value.startsWith('/')) {
                patch({ images: [...draft.images, value] });
                e.currentTarget.value = '';
              }
            }}
          />
          <span className="field-note">اكتب المسار ثم اضغط Enter.</span>
        </div>
      </section>

      <section className="admin-panel stack-sm">
        <div className="row-between">
          <h2 className="h3">الخيارات والأسعار</h2>
          <button
            type="button"
            className="text-btn"
            onClick={() => patch({ variants: [...draft.variants, emptyVariant()] })}
          >
            إضافة خيار
          </button>
        </div>

        {draft.variants.map((v, i) => (
          <div key={v.id} className="admin-variant">
            <div className="admin-grid-3">
              <div className="field">
                <label htmlFor={`v-color-${v.id}`}>اللون</label>
                <input
                  id={`v-color-${v.id}`}
                  value={v.color?.name ?? ''}
                  onChange={(e) =>
                    patchVariant(i, {
                      color: e.target.value
                        ? { name: e.target.value, hex: v.color?.hex ?? '#1a1a1a' }
                        : undefined,
                    })
                  }
                  maxLength={40}
                  placeholder="تيتانيوم طبيعي"
                />
              </div>

              <div className="field">
                <label htmlFor={`v-hex-${v.id}`}>درجة اللون</label>
                <input
                  id={`v-hex-${v.id}`}
                  type="color"
                  className="color-input"
                  value={v.color?.hex ?? '#1a1a1a'}
                  onChange={(e) =>
                    patchVariant(i, {
                      color: { name: v.color?.name ?? 'لون', hex: e.target.value },
                    })
                  }
                />
              </div>

              <div className="field">
                <label htmlFor={`v-storage-${v.id}`}>السعة</label>
                <input
                  id={`v-storage-${v.id}`}
                  value={v.storage ?? ''}
                  onChange={(e) => patchVariant(i, { storage: e.target.value || undefined })}
                  maxLength={40}
                  placeholder="256 غيغابايت"
                />
              </div>
            </div>

            <div className="admin-grid-4">
              <div className="field">
                <label htmlFor={`v-ram-${v.id}`}>الذاكرة</label>
                <input
                  id={`v-ram-${v.id}`}
                  value={v.ram ?? ''}
                  onChange={(e) => patchVariant(i, { ram: e.target.value || undefined })}
                  maxLength={40}
                  placeholder="8 غيغابايت"
                />
              </div>

              <div className="field">
                <label htmlFor={`v-price-${v.id}`}>السعر</label>
                <input
                  id={`v-price-${v.id}`}
                  className="tnum"
                  type="number"
                  min={0}
                  value={v.price || ''}
                  onChange={(e) => patchVariant(i, { price: Number(e.target.value) || 0 })}
                />
              </div>

              <div className="field">
                <label htmlFor={`v-compare-${v.id}`}>قبل الخصم</label>
                <input
                  id={`v-compare-${v.id}`}
                  className="tnum"
                  type="number"
                  min={0}
                  value={v.compareAtPrice || ''}
                  onChange={(e) =>
                    patchVariant(i, { compareAtPrice: Number(e.target.value) || undefined })
                  }
                />
              </div>

              <div className="field">
                <label htmlFor={`v-stock-${v.id}`}>الكمية</label>
                <input
                  id={`v-stock-${v.id}`}
                  className="tnum"
                  type="number"
                  min={0}
                  value={v.stock || 0}
                  onChange={(e) => patchVariant(i, { stock: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="row-between">
              <span className="faint small">
                {v.price > 0 ? formatPrice(v.price) : 'بلا سعر'}
              </span>
              {draft.variants.length > 1 ? (
                <button
                  type="button"
                  className="text-btn danger"
                  onClick={() => patch({ variants: draft.variants.filter((_, j) => j !== i) })}
                >
                  حذف الخيار
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="admin-panel stack-sm">
        <div className="row-between">
          <h2 className="h3">المزايا</h2>
          <button
            type="button"
            className="text-btn"
            onClick={() => patch({ highlights: [...(draft.highlights ?? []), ''] })}
          >
            إضافة ميزة
          </button>
        </div>

        {(draft.highlights ?? []).map((h, i) => (
          <div key={i} className="admin-inline-row">
            <input
              value={h}
              onChange={(e) => {
                const highlights = [...(draft.highlights ?? [])];
                highlights[i] = e.target.value;
                patch({ highlights });
              }}
              maxLength={120}
              aria-label={`ميزة ${i + 1}`}
            />
            <button
              type="button"
              className="text-btn danger"
              onClick={() => patch({ highlights: (draft.highlights ?? []).filter((_, j) => j !== i) })}
            >
              حذف
            </button>
          </div>
        ))}
      </section>

      <SpecGroupsEditor
        groups={draft.specGroups ?? []}
        onChange={(specGroups) => patch({ specGroups })}
      />

      <section className="admin-panel stack-sm">
        <h2 className="h3">متقدّم</h2>
        <div className="field">
          <label htmlFor="p-id">معرّف الصنف</label>
          <input
            id="p-id"
            className="ltr"
            value={draft.id}
            onChange={(e) => patch({ id: e.target.value })}
            maxLength={60}
            placeholder={slugify(draft.name || 'item')}
          />
          <span className="field-note">
            يظهر في رابط الصنف. اتركه فارغًا ليُشتق من الاسم. تغييره بعد النشر يكسر
            الروابط القديمة.
          </span>
        </div>
      </section>

      <div className="admin-toolbar">
        <button type="button" className="btn btn-quiet" onClick={() => navigate('/admin/products')}>
          إلغاء
        </button>
        <button type="button" className="btn btn-gold" onClick={save}>
          حفظ الصنف
        </button>
      </div>
    </div>
  );
}

function SpecGroupsEditor({
  groups,
  onChange,
}: {
  groups: SpecGroup[];
  onChange: (groups: SpecGroup[]) => void;
}) {
  const patchGroup = (index: number, changes: Partial<SpecGroup>) =>
    onChange(groups.map((g, i) => (i === index ? { ...g, ...changes } : g)));

  return (
    <section className="admin-panel stack-sm">
      <div className="row-between">
        <h2 className="h3">المواصفات</h2>
        <button
          type="button"
          className="text-btn"
          onClick={() => onChange([...groups, { title: '', specs: [{ label: '', value: '' }] }])}
        >
          إضافة مجموعة
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="muted small">لا مواصفات بعد — مثل الشاشة والمعالج والبطارية.</p>
      ) : null}

      {groups.map((group, gi) => (
        <div key={gi} className="admin-variant">
          <div className="admin-inline-row">
            <input
              value={group.title}
              onChange={(e) => patchGroup(gi, { title: e.target.value })}
              placeholder="عنوان المجموعة — مثل: الشاشة"
              maxLength={60}
              aria-label="عنوان المجموعة"
            />
            <button
              type="button"
              className="text-btn danger"
              onClick={() => onChange(groups.filter((_, i) => i !== gi))}
            >
              حذف المجموعة
            </button>
          </div>

          {group.specs.map((spec, si) => (
            <div key={si} className="admin-inline-row">
              <input
                value={spec.label}
                onChange={(e) =>
                  patchGroup(gi, {
                    specs: group.specs.map((s, i) =>
                      i === si ? { ...s, label: e.target.value } : s,
                    ),
                  })
                }
                placeholder="الخاصية"
                maxLength={60}
                aria-label="الخاصية"
              />
              <input
                value={spec.value}
                onChange={(e) =>
                  patchGroup(gi, {
                    specs: group.specs.map((s, i) =>
                      i === si ? { ...s, value: e.target.value } : s,
                    ),
                  })
                }
                placeholder="القيمة"
                maxLength={120}
                aria-label="القيمة"
              />
              <button
                type="button"
                className="text-btn danger"
                onClick={() =>
                  patchGroup(gi, { specs: group.specs.filter((_, i) => i !== si) })
                }
              >
                حذف
              </button>
            </div>
          ))}

          <button
            type="button"
            className="text-btn"
            onClick={() => patchGroup(gi, { specs: [...group.specs, { label: '', value: '' }] })}
          >
            إضافة خاصية
          </button>
        </div>
      ))}
    </section>
  );
}
