import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * ── قفل لوحة الإدارة ─────────────────────────────────────────
 *
 * القفل هنا يمنع العابر من فتح اللوحة على جهازك، ولا يزيد.
 * لا تعتمد عليه حماية حقيقية: الموقع كله يعمل داخل المتصفح، ومن
 * يملك الجهاز يستطيع بلوغ البيانات بأدوات المطوّر مهما فعلنا.
 * الحماية الفعلية لا تأتي إلا من خادم يتحقق من الهوية عنده،
 * وهو ما يُضاف عند الانتقال إلى استضافة حقيقية.
 *
 * الرمز لا يُحفَظ نصًّا، بل تُحفظ بصمته مع مِلح عشوائي.
 */

const ITERATIONS = 120_000;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

/** اشتقاق بصمة الرمز بـ PBKDF2، وهو متاح في كل متصفح حديث. */
export async function derive(passcode: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256,
  );
  return toHex(bits);
}

interface AuthState {
  /** بصمة الرمز، أو null إن لم يُضبط بعد */
  hash: string | null;
  salt: string | null;
  /** الجلسة مفتوحة الآن — لا تُحفَظ، فتُقفل اللوحة بإغلاق التبويب */
  unlocked: boolean;
  failedAttempts: number;
  lockedUntil: number | null;

  setPasscode: (passcode: string) => Promise<void>;
  unlock: (passcode: string) => Promise<boolean>;
  lock: () => void;
  clearPasscode: () => void;
}

export const useAdminAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      hash: null,
      salt: null,
      unlocked: false,
      failedAttempts: 0,
      lockedUntil: null,

      setPasscode: async (passcode) => {
        const salt = randomSalt();
        const hash = await derive(passcode, salt);
        set({ hash, salt, unlocked: true, failedAttempts: 0, lockedUntil: null });
      },

      unlock: async (passcode) => {
        const { hash, salt, lockedUntil, failedAttempts } = get();
        if (lockedUntil && Date.now() < lockedUntil) return false;
        if (!hash || !salt) return false;

        const candidate = await derive(passcode, salt);
        if (candidate === hash) {
          set({ unlocked: true, failedAttempts: 0, lockedUntil: null });
          return true;
        }

        const attempts = failedAttempts + 1;
        // تمهّلٌ متصاعد بعد خمس محاولات، يعطّل التخمين الآلي.
        set({
          failedAttempts: attempts,
          lockedUntil: attempts >= 5 ? Date.now() + Math.min(attempts - 4, 10) * 30_000 : null,
        });
        return false;
      },

      lock: () => set({ unlocked: false }),

      clearPasscode: () =>
        set({ hash: null, salt: null, unlocked: false, failedAttempts: 0, lockedUntil: null }),
    }),
    {
      name: 'optima.admin.auth',
      // الجلسة المفتوحة لا تُحفظ، فيُطلب الرمز في كل زيارة جديدة.
      partialize: (s) => ({
        hash: s.hash,
        salt: s.salt,
        failedAttempts: s.failedAttempts,
        lockedUntil: s.lockedUntil,
      }),
    },
  ),
);
