import { useState, type FormEvent, type ReactNode } from 'react';

import { useAdminAuth } from './adminAuth';

/**
 * شاشة القفل. تُضبط رمزًا جديدًا في أول زيارة، ثم تطلبه بعد ذلك.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const hash = useAdminAuth((s) => s.hash);
  const unlocked = useAdminAuth((s) => s.unlocked);
  const lockedUntil = useAdminAuth((s) => s.lockedUntil);
  const setPasscode = useAdminAuth((s) => s.setPasscode);
  const unlock = useAdminAuth((s) => s.unlock);

  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (unlocked) return <>{children}</>;

  const isSetup = !hash;
  const waitSeconds =
    lockedUntil && Date.now() < lockedUntil
      ? Math.ceil((lockedUntil - Date.now()) / 1000)
      : 0;

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
      await setPasscode(value);
      setBusy(false);
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

  return (
    <div className="admin-gate">
      <form className="admin-gate-card" onSubmit={(e) => void submit(e)}>
        <p className="brand center-text">
          <span>أوبتيما</span> <span className="brand-mark">فون</span>
        </p>
        <h1 className="h2 center-text">لوحة الإدارة</h1>

        <p className="small muted center-text">
          {isSetup
            ? 'اختر رمزًا لقفل اللوحة على هذا الجهاز.'
            : 'أدخل رمز الإدارة للمتابعة.'}
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

        <p className="admin-warn small">
          هذا القفل يمنع العابر من فتح اللوحة على جهازك فحسب. البيانات كلها
          محفوظة في هذا المتصفح، ومن يملك الجهاز يبلغها بأدوات المطوّر. الحماية
          الحقيقية تأتي مع الخادم عند الانتقال إلى استضافة ودومين.
        </p>
      </form>
    </div>
  );
}
