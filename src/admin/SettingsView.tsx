import { useState } from 'react';

import { useToastStore } from '../components/bits';
import { PAYMENT_CHANNELS } from '../config/store';
import { DEFAULT_SETTINGS, useStoreData } from '../data/storeData';
import { normalizeEgyptianPhone, sanitizeText, toInternational } from '../utils/security';

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
    </div>
  );
}
