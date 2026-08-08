import { useState, type FormEvent, type ReactNode } from 'react';

import { useStoreData } from '../data/storeData';
import { normalizeRecoveryKey, useAdminAuth } from './adminAuth';

type Mode = 'unlock' | 'recover' | 'wipe';

/**
 * شاشة القفل. تُضبط رمزًا جديدًا في أول زيارة، ثم تطلبه بعد ذلك،
 * وفيها مسارا استرجاع: بمفتاح الاسترجاع مع بقاء البيانات، أو
 * بمحوها كلها لمن فقد الرمز والمفتاح معًا.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const hash = useAdminAuth((s) => s.hash);
  const unlocked = useAdminAuth((s) => s.unlocked);
  const lockedUntil = useAdminAuth((s) => s.lockedUntil);
  const setPasscode = useAdminAuth((s) => s.setPasscode);
  const unlock = useAdminAuth((s) => s.unlock);
  const unlockWithRecovery = useAdminAuth((s) => s.unlockWithRecovery);
  const clearPasscode = useAdminAuth((s) => s.clearPasscode);
  const resetAll = useStoreData((s) => s.resetAll);

  const [mode, setMode] = useState<Mode>('unlock');
  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** المفتاح المولَّد حديثًا، يُعرض مرة واحدة ثم لا يُرى أبدًا. */
  const [freshKey, setFreshKey] = useState<string | null>(null);

  if (freshKey) {
    return <RecoveryKeyNotice value={freshKey} onDone={() => setFreshKey(null)} />;
  }

  if (unlocked) return <>{children}</>;

  const isSetup = !hash;
  const waitSeconds =
    lockedUntil && Date.now() < lockedUntil ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (isSetup) {
      if (value.length < 6) {
        setError('اجعل الرمز ستة محارف على الأقل.');
        return;
      }
      if (value !== confirm) {
        setError('الرمزان غير متطابقين.');
        return;
      }
      setBusy(true);
      const key = await setPasscode(value);
      setBusy(false);
      setValue('');
      setConfirm('');
      setFreshKey(key);
      return;
    }

    if (waitSeconds > 0) {
      setError(`محاولات كثيرة. أعد المحاولة بعد ${waitSeconds} ثانية.`);
      return;
    }

    setBusy(true);
    const ok = await unlock(value);
    setBusy(false);
    if (!ok) {
      setError('رمز غير صحيح.');
      setValue('');
    }
  };

  const submitRecovery = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (normalizeRecoveryKey(recoveryInput).length !== 25) {
      setError('مفتاح الاسترجاع خمس مجموعات، كل مجموعة خمسة محارف.');
      return;
    }

    setBusy(true);
    const ok = await unlockWithRecovery(recoveryInput);
    setBusy(false);
    if (!ok) {
      setError('مفتاح غير صحيح.');
      return;
    }
    setError(null);
    setRecoveryInput('');
  };

  /* ── الاسترجاع بالمفتاح ─────────────────────────────────── */

  if (mode === 'recover') {
    return (
      <div className="admin-gate">
        <form className="admin-gate-card" onSubmit={(e) => void submitRecovery(e)}>
          <h1 className="h2 center-text">الاسترجاع بالمفتاح</h1>
          <p className="small muted center-text">
            أدخل مفتاح الاسترجاع الذي عُرض عليك عند ضبط الرمز. بياناتك كلها تبقى
            كما هي.
          </p>

          <div className="field">
            <label htmlFor="a-recovery">مفتاح الاسترجاع</label>
            <input
              id="a-recovery"
              className="ltr recovery-input"
              value={recoveryInput}
              onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
              maxLength={34}
              autoFocus
            />
          </div>

          {error ? <p className="field-bad center-text">{error}</p> : null}

          <button type="submit" className="btn btn-gold full" disabled={busy}>
            فتح اللوحة
          </button>

          <button
            type="button"
            className="text-btn center-text"
            onClick={() => {
              setMode('unlock');
              setError(null);
            }}
          >
            رجوع
          </button>

          <button
            type="button"
            className="text-btn danger center-text"
            onClick={() => {
              setMode('wipe');
              setError(null);
            }}
          >
            فقدتُ المفتاح أيضًا
          </button>
        </form>
      </div>
    );
  }

  /* ── الملاذ الأخير: محو كل شيء ──────────────────────────── */

  if (mode === 'wipe') {
    return (
      <div className="admin-gate">
        <div className="admin-gate-card">
          <h1 className="h2 center-text">بدء من جديد</h1>

          <p className="admin-warn small">
            من فقد الرمز والمفتاح معًا فلا سبيل أمامه إلا هذا: يُلغى القفل وتُمحى
            الأصناف وكروت الخصم والطلبات والإعدادات، ثم تضبط رمزًا جديدًا. ولو
            كان ثمة زرٌّ يفتح اللوحة بلا ثمن لما بقي للقفل معنى.
          </p>

          <p className="small muted">
            إن كان لديك ملف نسخة احتياطية فاستعده بعد ذلك من صفحة «النسخ والنشر»،
            فيعود كل شيء كما كان.
          </p>

          <button
            type="button"
            className="btn btn-quiet danger full"
            onClick={() => {
              resetAll();
              clearPasscode();
              setMode('unlock');
              setValue('');
              setConfirm('');
              setError(null);
            }}
          >
            محو كل شيء وضبط رمز جديد
          </button>

          <button
            type="button"
            className="text-btn center-text"
            onClick={() => {
              setMode('unlock');
              setError(null);
            }}
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  /* ── الدخول أو الضبط الأول ──────────────────────────────── */

  return (
    <div className="admin-gate">
      <form className="admin-gate-card" onSubmit={(e) => void submit(e)}>
        <p className="brand center-text">
          <span>أوبتيما</span> <span className="brand-mark">فون</span>
        </p>
        <h1 className="h2 center-text">لوحة الإدارة</h1>

        <p className="small muted center-text">
          {isSetup ? 'اختر رمزًا لقفل اللوحة على هذا الجهاز.' : 'أدخل رمز الإدارة للمتابعة.'}
        </p>

        <div className="field">
          <label htmlFor="a-pass">رمز الإدارة</label>
          <input
            id="a-pass"
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete={isSetup ? 'new-password' : 'current-password'}
            maxLength={64}
            autoFocus
          />
        </div>

        {isSetup ? (
          <div className="field">
            <label htmlFor="a-confirm">تأكيد الرمز</label>
            <input
              id="a-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              maxLength={64}
            />
          </div>
        ) : null}

        {error ? <p className="field-bad center-text">{error}</p> : null}

        <button type="submit" className="btn btn-gold full" disabled={busy}>
          {isSetup ? 'ضبط الرمز والدخول' : 'دخول'}
        </button>

        {!isSetup ? (
          <button
            type="button"
            className="text-btn center-text"
            onClick={() => {
              setMode('recover');
              setError(null);
            }}
          >
            نسيتُ الرمز
          </button>
        ) : null}

        <p className="admin-warn small">
          هذا القفل يمنع العابر من فتح اللوحة على جهازك فحسب. البيانات كلها
          محفوظة في هذا المتصفح، ومن يملك الجهاز يبلغها بأدوات المطوّر. الحماية
          الحقيقية تأتي مع الخادم عند الانتقال إلى استضافة ودومين.
        </p>
      </form>
    </div>
  );
}

/**
 * عرض مفتاح الاسترجاع مرة واحدة. لا يُحفظ نصًّا في أي موضع، فإن
 * لم يدوّنه التاجر الآن فلن يراه ثانية أبدًا.
 */
function RecoveryKeyNotice({ value, onDone }: { value: string; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="admin-gate">
      <div className="admin-gate-card">
        <h1 className="h2 center-text">مفتاح الاسترجاع</h1>

        <p className="small muted center-text">
          إن نسيتَ الرمز فهذا المفتاح وحده يفتح اللوحة دون أن تفقد شيئًا.
          دوّنه الآن في مكان أمين.
        </p>

        <p className="recovery-key ltr tnum">{value}</p>

        <div className="admin-row-actions">
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              void navigator.clipboard?.writeText(value);
              setCopied(true);
            }}
          >
            {copied ? 'نُسخ ✓' : 'نسخ'}
          </button>

          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              const blob = new Blob(
                [
                  `مفتاح استرجاع لوحة إدارة أوبتيما فون\n\n${value}\n\n` +
                    `احتفظ بهذا الملف بعيدًا عن المتصفح.\n`,
                ],
                { type: 'text/plain' },
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'optimaphone-recovery-key.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            تنزيل
          </button>
        </div>

        <label className="admin-check">
          <input
            type="checkbox"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
          />
          <span>دوّنتُ المفتاح في مكان أمين</span>
        </label>

        <button type="button" className="btn btn-gold full" disabled={!saved} onClick={onDone}>
          متابعة إلى اللوحة
        </button>
      </div>
    </div>
  );
}
