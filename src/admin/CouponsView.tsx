import { useState } from 'react';

import { useToastStore } from '../components/bits';
import { useStoreData } from '../data/storeData';
import type { Coupon, DiscountKind } from '../domain/admin';
import { describeCoupon, generateCouponCode } from '../utils/coupons';
import { formatDate, formatNumber, formatPrice, secureId } from '../utils/format';
import { sanitizeText } from '../utils/security';

const KINDS: { id: DiscountKind; label: string; hint: string }[] = [
  { id: 'percent', label: 'نسبة مئوية', hint: 'خصم بنسبة من قيمة الأصناف' },
  { id: 'fixed', label: 'مبلغ ثابت', hint: 'خصم بمبلغ محدَّد بالجنيه' },
  { id: 'shipping', label: 'شحن مجاني', hint: 'يُسقط رسوم الشحن' },
];

function blankCoupon(): Coupon {
  return {
    id: secureId('cpn'),
    code: generateCouponCode(),
    kind: 'percent',
    value: 10,
    minSubtotal: undefined,
    maxDiscount: undefined,
    usageLimit: null,
    usedCount: 0,
    startsAt: null,
    expiresAt: null,
    productIds: [],
    active: true,
    note: '',
    createdAt: new Date().toISOString(),
  };
}

/** حالة الكرت الآن: فعّال، أو موقوف، أو منتهٍ، أو مستنفَد. */
function couponState(c: Coupon): { label: string; tone: string } {
  if (!c.active) return { label: 'موقوف', tone: 'bad' };
  if (c.expiresAt && Date.now() > new Date(c.expiresAt).getTime() + 86_399_000) {
    return { label: 'منتهٍ', tone: 'bad' };
  }
  if (c.startsAt && Date.now() < new Date(c.startsAt).getTime()) {
    return { label: 'لم يبدأ', tone: 'warn' };
  }
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) {
    return { label: 'مستنفَد', tone: 'warn' };
  }
  return { label: 'فعّال', tone: 'good' };
}

export function CouponsView() {
  const coupons = useStoreData((s) => s.coupons);
  const products = useStoreData((s) => s.products);
  const saveCoupon = useStoreData((s) => s.saveCoupon);
  const removeCoupon = useStoreData((s) => s.removeCoupon);
  const notify = useToastStore((s) => s.show);

  const [draft, setDraft] = useState<Coupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const patch = (changes: Partial<Coupon>) =>
    setDraft((d) => (d ? { ...d, ...changes } : d));

  const commit = () => {
    if (!draft) return;
    const code = sanitizeText(draft.code, 24).toUpperCase().replace(/\s+/g, '');
    if (code.length < 3) {
      setError('الرمز ثلاثة محارف على الأقل.');
      return;
    }
    if (coupons.some((c) => c.code === code && c.id !== draft.id)) {
      setError('يوجد كرت آخر بهذا الرمز.');
      return;
    }
    if (draft.kind === 'percent' && (draft.value <= 0 || draft.value > 100)) {
      setError('النسبة بين 1 و 100.');
      return;
    }
    if (draft.kind === 'fixed' && draft.value <= 0) {
      setError('أدخل مبلغ الخصم.');
      return;
    }

    setError(null);
    saveCoupon({ ...draft, code, note: sanitizeText(draft.note ?? '', 120) });
    notify('حُفظ الكرت');
    setDraft(null);
  };

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <div>
          <h1 className="h2">كروت الخصم</h1>
          <p className="small muted">
            يكتب العميل الرمز في صفحة السلة فيُخصَم من الإجمالي.
          </p>
        </div>
        <button type="button" className="btn btn-gold" onClick={() => setDraft(blankCoupon())}>
          كرت جديد
        </button>
      </div>

      {draft ? (
        <section className="admin-panel stack-sm">
          <h2 className="h3">{coupons.some((c) => c.id === draft.id) ? 'تعديل كرت' : 'كرت جديد'}</h2>

          <div className="admin-grid-2">
            <div className="field">
              <label htmlFor="c-code">الرمز</label>
              <div className="admin-inline-row">
                <input
                  id="c-code"
                  className="ltr strong"
                  value={draft.code}
                  onChange={(e) => patch({ code: e.target.value.toUpperCase() })}
                  maxLength={24}
                />
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => patch({ code: generateCouponCode() })}
                >
                  توليد
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="c-kind">نوع الخصم</label>
              <select
                id="c-kind"
                value={draft.kind}
                onChange={(e) => patch({ kind: e.target.value as DiscountKind })}
              >
                {KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
              <span className="field-note">
                {KINDS.find((k) => k.id === draft.kind)?.hint}
              </span>
            </div>
          </div>

          {draft.kind !== 'shipping' ? (
            <div className="admin-grid-2">
              <div className="field">
                <label htmlFor="c-value">
                  {draft.kind === 'percent' ? 'النسبة %' : 'المبلغ بالجنيه'}
                </label>
                <input
                  id="c-value"
                  className="tnum"
                  type="number"
                  min={1}
                  max={draft.kind === 'percent' ? 100 : undefined}
                  value={draft.value || ''}
                  onChange={(e) => patch({ value: Number(e.target.value) || 0 })}
                />
              </div>

              {draft.kind === 'percent' ? (
                <div className="field">
                  <label htmlFor="c-max">سقف الخصم</label>
                  <input
                    id="c-max"
                    className="tnum"
                    type="number"
                    min={0}
                    value={draft.maxDiscount ?? ''}
                    onChange={(e) => patch({ maxDiscount: Number(e.target.value) || undefined })}
                  />
                  <span className="field-note">اتركه فارغًا لبلا سقف.</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="admin-grid-2">
            <div className="field">
              <label htmlFor="c-min">أقل قيمة للسلة</label>
              <input
                id="c-min"
                className="tnum"
                type="number"
                min={0}
                value={draft.minSubtotal ?? ''}
                onChange={(e) => patch({ minSubtotal: Number(e.target.value) || undefined })}
              />
            </div>

            <div className="field">
              <label htmlFor="c-limit">عدد مرات الاستعمال</label>
              <input
                id="c-limit"
                className="tnum"
                type="number"
                min={0}
                value={draft.usageLimit ?? ''}
                onChange={(e) => patch({ usageLimit: Number(e.target.value) || null })}
              />
              <span className="field-note">اتركه فارغًا لاستعمال غير محدود.</span>
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="field">
              <label htmlFor="c-start">يبدأ في</label>
              <input
                id="c-start"
                type="date"
                value={draft.startsAt?.slice(0, 10) ?? ''}
                onChange={(e) => patch({ startsAt: e.target.value || null })}
              />
            </div>

            <div className="field">
              <label htmlFor="c-end">ينتهي في</label>
              <input
                id="c-end"
                type="date"
                value={draft.expiresAt?.slice(0, 10) ?? ''}
                onChange={(e) => patch({ expiresAt: e.target.value || null })}
              />
            </div>
          </div>

          {products.length > 0 ? (
            <div className="field">
              <span className="small muted">تقييد بأصناف بعينها</span>
              <div className="admin-chips">
                {products.map((p) => {
                  const on = draft.productIds?.includes(p.id) ?? false;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={on ? 'chip on' : 'chip'}
                      aria-pressed={on}
                      onClick={() =>
                        patch({
                          productIds: on
                            ? (draft.productIds ?? []).filter((id) => id !== p.id)
                            : [...(draft.productIds ?? []), p.id],
                        })
                      }
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
              <span className="field-note">بلا اختيار يسري الكرت على كل الأصناف.</span>
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="c-note">ملاحظة داخلية</label>
            <input
              id="c-note"
              value={draft.note ?? ''}
              onChange={(e) => patch({ note: e.target.value })}
              maxLength={120}
              placeholder="مثال: حملة رمضان"
            />
          </div>

          <div className="field">
            <span className="small muted">الكرت فعّال</span>
            <button
              type="button"
              className={draft.active ? 'toggle on' : 'toggle'}
              onClick={() => patch({ active: !draft.active })}
              aria-pressed={draft.active}
            >
              <i />
            </button>
          </div>

          {error ? <p className="field-bad">{error}</p> : null}

          <div className="admin-row-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setDraft(null)}>
              إلغاء
            </button>
            <button type="button" className="btn btn-gold" onClick={commit}>
              حفظ الكرت
            </button>
          </div>
        </section>
      ) : null}

      {coupons.length === 0 ? (
        <div className="admin-panel center-text stack-sm">
          <p className="h3">لا كروت خصم بعد</p>
          <p className="muted small">أنشئ كرتًا وابدأ حملتك الأولى.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>الرمز</th>
                <th>الخصم</th>
                <th>الشروط</th>
                <th>الاستعمال</th>
                <th>الحالة</th>
                <th aria-label="إجراءات" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const state = couponState(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <span className="ltr strong">{c.code}</span>
                      {c.note ? <div className="faint small">{c.note}</div> : null}
                    </td>
                    <td>{describeCoupon(c)}</td>
                    <td className="small">
                      {c.minSubtotal ? <div>من {formatPrice(c.minSubtotal)}</div> : null}
                      {c.maxDiscount ? <div>سقف {formatPrice(c.maxDiscount)}</div> : null}
                      {c.expiresAt ? <div>حتى {formatDate(c.expiresAt)}</div> : null}
                      {!c.minSubtotal && !c.maxDiscount && !c.expiresAt ? (
                        <span className="faint">بلا شروط</span>
                      ) : null}
                    </td>
                    <td className="tnum">
                      {formatNumber(c.usedCount)}
                      {c.usageLimit != null ? ` / ${formatNumber(c.usageLimit)}` : ''}
                    </td>
                    <td>
                      <span className={`pill tone-${state.tone}`}>{state.label}</span>
                    </td>
                    <td className="admin-row-actions">
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => {
                          void navigator.clipboard?.writeText(c.code);
                          notify('نُسخ الرمز');
                        }}
                      >
                        نسخ
                      </button>
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => saveCoupon({ ...c, active: !c.active })}
                      >
                        {c.active ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <button type="button" className="text-btn" onClick={() => setDraft(structuredClone(c))}>
                        تعديل
                      </button>
                      {confirmId === c.id ? (
                        <button
                          type="button"
                          className="text-btn danger"
                          onClick={() => {
                            removeCoupon(c.id);
                            setConfirmId(null);
                            notify('حُذف الكرت');
                          }}
                        >
                          تأكيد
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-btn danger"
                          onClick={() => setConfirmId(c.id)}
                        >
                          حذف
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
