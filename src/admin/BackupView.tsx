import { useRef, useState } from 'react';

import { useToastStore } from '../components/bits';
import { buildSnapshot, useStoreData } from '../data/storeData';
import type { DataSnapshot } from '../domain/admin';
import type { Product } from '../domain/entities';
import { useAdminAuth } from './adminAuth';

/** يحوّل قيمة إلى نص TypeScript صالح، بمسافات بادئة مرتّبة. */
function literal(value: unknown, indent = 2): string {
  const pad = ' '.repeat(indent);
  const padInner = ' '.repeat(indent + 2);

  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => `${padInner}${literal(v, indent + 2)}`);
    return `[\n${items.join(',\n')}\n${pad}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    if (entries.length === 0) return '{}';
    const body = entries.map(([k, v]) => `${padInner}${k}: ${literal(v, indent + 2)}`);
    return `{\n${body.join(',\n')}\n${pad}}`;
  }

  return 'undefined';
}

/**
 * يبني محتوى `src/data/catalog.ts` من الأصناف الحالية.
 *
 * هذا هو الجسر بين لوحة الإدارة والنشر الفعلي: ما دام الموقع
 * ثابتًا بلا خادم، فالأصناف لا تصل إلى الزوار إلا بوضعها في هذا
 * الملف ورفعه إلى المستودع.
 */
function buildCatalogFile(products: Product[]): string {
  const withoutInlineImages = products.map((p) => ({
    ...p,
    images: p.images.filter((src) => src.startsWith('/')),
  }));

  return `import type { Product } from '../domain/entities';

/**
 * ── بضاعة المتجر ──────────────────────────────────────────────
 *
 * وُلّد هذا الملف من لوحة الإدارة. لا يُحرَّر يدويًا إلا عند الحاجة؛
 * أي تعديل هنا يُدهس عند التصدير التالي.
 *
 * الصور المضمَّنة (المرفوعة من الجهاز) لا تُصدَّر. ضع ملفاتها في
 * مجلد public/products وأشِر إليها بمسار يبدأ بـ '/products/'.
 */
export const PRODUCTS: Product[] = ${literal(withoutInlineImages, 0)};
`;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function BackupView() {
  const notify = useToastStore((s) => s.show);
  const products = useStoreData((s) => s.products);
  const importSnapshot = useStoreData((s) => s.importSnapshot);
  const resetAll = useStoreData((s) => s.resetAll);
  const clearPasscode = useAdminAuth((s) => s.clearPasscode);

  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const inlineCount = products.reduce(
    (sum, p) => sum + p.images.filter((s) => s.startsWith('data:')).length,
    0,
  );

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as DataSnapshot;
      if (parsed.version !== 1 || !Array.isArray(parsed.products)) {
        setMessage('الملف ليس نسخة صالحة.');
        return;
      }
      importSnapshot(parsed);
      setMessage(null);
      notify('استُعيدت النسخة');
    } catch {
      setMessage('تعذّرت قراءة الملف.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="stack">
      <h1 className="h2">النسخ والنشر</h1>

      <section className="admin-panel stack-sm">
        <h2 className="h3">نسخة احتياطية</h2>
        <p className="small muted">
          كل بياناتك — الأصناف والكروت والطلبات والإعدادات — في ملف واحد. احتفظ به
          خارج الجهاز، فمسح بيانات المتصفح يمحو كل شيء.
        </p>
        <div className="admin-row-actions">
          <button
            type="button"
            className="btn btn-gold"
            onClick={() => {
              const stamp = new Date().toISOString().slice(0, 10);
              download(
                `optimaphone-backup-${stamp}.json`,
                JSON.stringify(buildSnapshot(), null, 2),
                'application/json',
              );
              notify('نُزّلت النسخة');
            }}
          >
            تنزيل نسخة
          </button>

          <label className="btn btn-quiet" htmlFor="b-import">
            استعادة نسخة
          </label>
          <input
            ref={fileRef}
            id="b-import"
            type="file"
            accept="application/json"
            className="visually-hidden"
            onChange={(e) => void onImport(e.target.files?.[0])}
          />
        </div>
        {message ? <p className="field-bad small">{message}</p> : null}
      </section>

      <section className="admin-panel stack-sm">
        <h2 className="h3">نشر الأصناف للزوار</h2>
        <p className="small muted">
          الأصناف التي تضيفها هنا محفوظة في متصفحك أنت. ليراها الزوار على الموقع
          المنشور، نزّل ملف الكتالوج وضعه مكان <code>src/data/catalog.ts</code> في
          المستودع، فيُعاد بناء الموقع ونشره تلقائيًا.
        </p>

        {inlineCount > 0 ? (
          <p className="admin-warn small">
            لديك {inlineCount} صورة مرفوعة من الجهاز. هذه لا تُصدَّر في الملف:
            ضع ملفاتها في <code>public/products</code> وأشِر إليها بمسار يبدأ بـ
            <code> /products/</code> قبل النشر.
          </p>
        ) : null}

        <div className="admin-row-actions">
          <button
            type="button"
            className="btn btn-gold"
            disabled={products.length === 0}
            onClick={() => {
              download('catalog.ts', buildCatalogFile(products), 'text/plain');
              notify('نُزّل ملف الكتالوج');
            }}
          >
            تنزيل catalog.ts
          </button>

          <button
            type="button"
            className="btn btn-quiet"
            disabled={products.length === 0}
            onClick={() => {
              void navigator.clipboard?.writeText(buildCatalogFile(products));
              notify('نُسخ محتوى الملف');
            }}
          >
            نسخ المحتوى
          </button>
        </div>
      </section>

      <section className="admin-panel stack-sm">
        <h2 className="h3">منطقة الخطر</h2>
        <p className="small muted">
          لا رجعة في هذه الإجراءات. نزّل نسخة احتياطية أولًا.
        </p>

        <div className="admin-row-actions">
          {confirmReset ? (
            <>
              <button
                type="button"
                className="btn btn-quiet danger"
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                  notify('مُحيت البيانات');
                }}
              >
                تأكيد محو كل البيانات
              </button>
              <button type="button" className="text-btn" onClick={() => setConfirmReset(false)}>
                تراجع
              </button>
            </>
          ) : (
            <button
              type="button"
              className="text-btn danger"
              onClick={() => setConfirmReset(true)}
            >
              محو كل بيانات اللوحة
            </button>
          )}

          <button
            type="button"
            className="text-btn danger"
            onClick={() => {
              clearPasscode();
              notify('أُلغي رمز الإدارة');
            }}
          >
            إلغاء رمز الإدارة
          </button>
        </div>
      </section>
    </div>
  );
}
