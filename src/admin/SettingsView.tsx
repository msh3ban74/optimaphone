import { useMemo, useState } from 'react';

import { useToastStore } from '../components/bits';
import { PAYMENT_CHANNELS } from '../config/store';
import { DEFAULT_SETTINGS, useStoreData } from '../data/storeData';
import { normalizeEgyptianPhone, sanitizeText, toInternational } from '../utils/security';
import { useAdminAuth } from './adminAuth';

/** إعدادات المتجر التي يملك التاجر تغييرها دون لمس الكود. */
export function SettingsView() {
  const settings = useStoreData((s) => s.settings);
  const saveSettings = useStoreData((s) => s.saveSettings);
  const notify = useToastStore((s) => s.show);

  const [draft, setDraft] = useState(settings);
  const [error, setError] = useState<string | null>(null);

  const patch = (changes: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...changes }));

  const commit = () => {
    const local = normalizeEgyptianPhone(draft.transferNumberLocal);
    if (!local) {
      setError('رقم التحويل غير صالح.');
      return;
    }
    const international = toInternational(local);
    setError(null);
    saveSettings({
      ...draft,
      name: sanitizeText(draft.name, 60) || DEFAULT_SETTINGS.name,
      tagline: sanitizeText(draft.tagline, 120),
      transferNumberLocal: local,
      whatsapp: international ?? draft.whatsapp,
      facebook: draft.facebook.startsWith('https://') ? draft.facebook : '',
      shippingFee: Math.max(0, Math.round(draft.shippingFee)),
      freeShippingOver:
        draft.freeShippingOver && draft.freeShippingOver > 0
          ? Math.round(draft.freeShippingOver)
          : null,
      lowStockThreshold: Math.max(0, Math.round(draft.lowStockThreshold)),
    });
    notify('حُفظت الإعدادات');
  };

  return (
    <div className="stack">
      <h1 className="h2">إعدادات المتجر</h1>

      <section className="admin-panel stack-sm">
        <h2 className="h3">الهوية</h2>

        <div className="field">
          <label htmlFor="s-name">اسم المتجر</label>
          <input
            id="s-name"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            maxLength={60}
          />
        </div>

        <div className="field">
          <label htmlFor="s-tagline">سطر التعريف</label>
          <input
            id="s-tagline"
            value={draft.tagline}
            onChange={(e) => patch({ tagline: e.target.value })}
            maxLength={120}
          />
        </div>
      </section>

      <section className="admin-panel stack-sm">
        <h2 className="h3">التواصل والتحصيل</h2>

        <div className="field">
          <label htmlFor="s-number">رقم الواتساب والتحويل</label>
          <input
            id="s-number"
            className="ltr end-text tnum"
            value={draft.transferNumberLocal}
            onChange={(e) => patch({ transferNumberLocal: e.target.value })}
            inputMode="tel"
            maxLength={20}
          />
          <span className="field-note">
            إليه تصل الطلبات، وإليه يحوّل العملاء. يُشتق الرقم الدولي منه تلقائيًا.
          </span>
        </div>

        <div className="field">
          <label htmlFor="s-facebook">صفحة فيسبوك</label>
          <input
            id="s-facebook"
            className="ltr"
            value={draft.facebook}
            onChange={(e) => patch({ facebook: e.target.value })}
            maxLength={200}
            placeholder="https://..."
          />
        </div>

        <div className="field">
          <span className="small muted">إظهار الرقم في تذييل الموقع</span>
          <button
            type="button"
            className={draft.showNumberInFooter ? 'toggle on' : 'toggle'}
            onClick={() => patch({ showNumberInFooter: !draft.showNumberInFooter })}
            aria-pressed={draft.showNumberInFooter}
          >
            <i />
          </button>
        </div>
      </section>

      <section className="admin-panel stack-sm">
        <h2 className="h3">الشحن والمخزون</h2>

        <div className="admin-grid-2">
          <div className="field">
            <label htmlFor="s-fee">رسوم الشحن</label>
            <input
              id="s-fee"
              className="tnum"
              type="number"
              min={0}
              value={draft.shippingFee || 0}
              onChange={(e) => patch({ shippingFee: Number(e.target.value) || 0 })}
            />
          </div>

          <div className="field">
            <label htmlFor="s-free">شحن مجاني فوق</label>
            <input
              id="s-free"
              className="tnum"
              type="number"
              min={0}
              value={draft.freeShippingOver ?? ''}
              onChange={(e) => patch({ freeShippingOver: Number(e.target.value) || null })}
            />
            <span className="field-note">اتركه فارغًا لتعطيل الشحن المجاني.</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="s-low">حد التنبيه لقلة المخزون</label>
          <input
            id="s-low"
            className="tnum"
            type="number"
            min={0}
            value={draft.lowStockThreshold}
            onChange={(e) => patch({ lowStockThreshold: Number(e.target.value) || 0 })}
          />
        </div>
      </section>

      <section className="admin-panel stack-sm">
        <h2 className="h3">وسائل السداد</h2>
        {PAYMENT_CHANNELS.map((channel) => {
          const current =
            draft.payments.find((p) => p.id === channel.id)?.enabled ?? channel.enabled;
          return (
            <div key={channel.id} className="admin-inline-row">
              <span className="grow">
                {channel.label}
                <div className="faint small">{channel.note}</div>
              </span>
              <button
                type="button"
                className={current ? 'toggle on' : 'toggle'}
                aria-pressed={current}
                aria-label={channel.label}
                onClick={() =>
                  patch({
                    payments: PAYMENT_CHANNELS.map((c) => ({
                      id: c.id,
                      enabled:
                        c.id === channel.id
                          ? !current
                          : (draft.payments.find((p) => p.id === c.id)?.enabled ?? c.enabled),
                    })),
                  })
                }
              >
                <i />
              </button>
            </div>
          );
        })}
      </section>

      {error ? <p className="field-bad">{error}</p> : null}

      <div className="admin-toolbar">
        <button type="button" className="btn btn-quiet" onClick={() => setDraft(settings)}>
          استرجاع
        </button>
        <button type="button" className="btn btn-gold" onClick={commit}>
          حفظ الإعدادات
        </button>
      </div>

      <TaxonomyEditor />
      <PasscodeEditor />
    </div>
  );
}

/* ── الفئات والعلامات ────────────────────────────────────────── */

/**
 * الفئات والعلامات مشتقّة من الأصناف لا مخزَّنة على حدة، فتغيير
 * الاسم هنا يمرّ على كل صنف يحملها. هذا يمنع فئةً يتيمة لا صنف
 * فيها، ويمنع اسمين لشيء واحد.
 */
function TaxonomyEditor() {
  const products = useStoreData((s) => s.products);
  const setProducts = useStoreData((s) => s.setProducts);
  const notify = useToastStore((s) => s.show);

  const [editing, setEditing] = useState<{ kind: 'category' | 'brand'; id: string } | null>(null);
  const [value, setValue] = useState('');

  const groups = useMemo(() => {
    const categories = new Map<string, { name: string; count: number }>();
    const brands = new Map<string, { name: string; count: number }>();

    for (const p of products) {
      const c = categories.get(p.category) ?? { name: p.categoryName, count: 0 };
      c.count += 1;
      categories.set(p.category, c);

      const b = brands.get(p.brand) ?? { name: p.brandName, count: 0 };
      b.count += 1;
      brands.set(p.brand, b);
    }

    return { categories: [...categories.entries()], brands: [...brands.entries()] };
  }, [products]);

  const rename = () => {
    if (!editing) return;
    const name = sanitizeText(value, 60);
    if (name.length < 2) {
      notify('الاسم قصير');
      return;
    }

    setProducts(
      products.map((p) => {
        if (editing.kind === 'category' && p.category === editing.id) {
          return { ...p, categoryName: name };
        }
        if (editing.kind === 'brand' && p.brand === editing.id) {
          return { ...p, brandName: name };
        }
        return p;
      }),
    );

    setEditing(null);
    setValue('');
    notify('غُيّر الاسم في كل الأصناف');
  };

  if (products.length === 0) return null;

  const renderRows = (
    kind: 'category' | 'brand',
    entries: [string, { name: string; count: number }][],
  ) =>
    entries.map(([id, info]) => (
      <div key={`${kind}-${id}`} className="admin-list-row">
        {editing?.kind === kind && editing.id === id ? (
          <>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={60}
              aria-label="الاسم الجديد"
              autoFocus
            />
            <button type="button" className="text-btn" onClick={rename}>
              حفظ
            </button>
            <button type="button" className="text-btn" onClick={() => setEditing(null)}>
              إلغاء
            </button>
          </>
        ) : (
          <>
            <span className="grow">{info.name}</span>
            <span className="faint small">{info.count} صنف</span>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setEditing({ kind, id });
                setValue(info.name);
              }}
            >
              تغيير الاسم
            </button>
          </>
        )}
      </div>
    ));

  return (
    <section className="admin-panel stack-sm">
      <h2 className="h3">الفئات والعلامات</h2>
      <p className="small muted">
        مشتقّة من أصنافك. تغيير الاسم هنا يسري على كل صنف يحمله.
      </p>

      <h3 className="small strong">الفئات</h3>
      <div className="admin-list">{renderRows('category', groups.categories)}</div>

      <h3 className="small strong">العلامات</h3>
      <div className="admin-list">{renderRows('brand', groups.brands)}</div>
    </section>
  );
}

/* ── تغيير رمز الإدارة ───────────────────────────────────────── */

function PasscodeEditor() {
  const changePasscode = useAdminAuth((s) => s.changePasscode);
  const notify = useToastStore((s) => s.show);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (next.length < 6) {
      setProblem('اجعل الرمز الجديد ستة محارف على الأقل.');
      return;
    }
    if (next !== confirm) {
      setProblem('الرمزان الجديدان غير متطابقين.');
      return;
    }

    setBusy(true);
    const key = await changePasscode(current, next);
    setBusy(false);

    if (!key) {
      setProblem('الرمز الحالي غير صحيح.');
      return;
    }

    setProblem(null);
    setCurrent('');
    setNext('');
    setConfirm('');
    setFreshKey(key);
    notify('غُيّر الرمز');
  };

  return (
    <section className="admin-panel stack-sm">
      <h2 className="h3">رمز الإدارة</h2>

      {freshKey ? (
        <>
          <p className="admin-warn small">
            مفتاح استرجاع جديد، والقديم لم يعد صالحًا. دوّنه الآن — لن يُعرض ثانية.
          </p>
          <p className="recovery-key ltr tnum">{freshKey}</p>
          <div className="admin-row-actions">
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => {
                void navigator.clipboard?.writeText(freshKey);
                notify('نُسخ المفتاح');
              }}
            >
              نسخ
            </button>
            <button type="button" className="text-btn" onClick={() => setFreshKey(null)}>
              دوّنتُه، أغلِق
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="field">
            <label htmlFor="pc-current">الرمز الحالي</label>
            <input
              id="pc-current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              maxLength={64}
              autoComplete="current-password"
            />
          </div>

          <div className="admin-grid-2">
            <div className="field">
              <label htmlFor="pc-next">الرمز الجديد</label>
              <input
                id="pc-next"
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                maxLength={64}
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label htmlFor="pc-confirm">تأكيده</label>
              <input
                id="pc-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                maxLength={64}
                autoComplete="new-password"
              />
            </div>
          </div>

          {problem ? <p className="field-bad">{problem}</p> : null}

          <div>
            <button
              type="button"
              className="btn btn-quiet"
              disabled={busy}
              onClick={() => void submit()}
            >
              تغيير الرمز
            </button>
          </div>

          <p className="field-note">
            تغيير الرمز يولّد مفتاح استرجاع جديدًا ويُبطل القديم.
          </p>
        </>
      )}
    </section>
  );
}
