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
 * لا الرمز ولا مفتاح الاسترجاع يُحفَظ نصًّا، بل تُحفظ بصمة كلٍّ
 * منهما مع مِلح عشوائي.
 *
 * الاسترجاع مصمَّم على قاعدة واحدة: كل طريق يفتح اللوحة دون الرمز
 * يجب أن يكلّف شيئًا. فمفتاح الاسترجاع يفتحها ويبقي البيانات،
 * وأما من فقد الاثنين فلا سبيل أمامه إلا محو البيانات كلها. ولو
 * جعلنا هناك زرًّا يفكّ القفل بلا ثمن لما بقي للقفل معنى.
 */

const ITERATIONS = 120_000;

/** حروف مفتاح الاسترجاع، بلا ما يلتبس رسمه: O و0 و I و1. */
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

/** مفتاح استرجاع من خمس مجموعات، كل مجموعة خمسة محارف. */
export function generateRecoveryKey(): string {
  const bytes = new Uint8Array(25);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => KEY_ALPHABET[b % KEY_ALPHABET.length]);
  const groups: string[] = [];
  for (let i = 0; i < 5; i += 1) groups.push(chars.slice(i * 5, i * 5 + 5).join(''));
  return groups.join('-');
}

/** يوحّد صيغة المفتاح المكتوب: حروف كبيرة بلا فواصل ولا مسافات. */
export function normalizeRecoveryKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** اشتقاق بصمة بـ PBKDF2، وهو متاح في كل متصفح حديث. */
export async function derive(secret: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
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

/** مدة الخمول التي تُقفل اللوحة بعدها من تلقاء نفسها. */
export const IDLE_LOCK_MS = 30 * 60 * 1000;

interface AuthState {
  /** بصمة الرمز، أو null إن لم يُضبط بعد */
  hash: string | null;
  salt: string | null;
  /** بصمة مفتاح الاسترجاع */
  recoveryHash: string | null;
  recoverySalt: string | null;
  /** الجلسة مفتوحة الآن — لا تُحفَظ، فتُقفل اللوحة بإغلاق التبويب */
  unlocked: boolean;
  failedAttempts: number;
  lockedUntil: number | null;
  /** آخر نشاط، لقفل الخمول */
  lastActivity: number;

  /**
   * يضبط رمزًا جديدًا ويعيد مفتاح استرجاع يُعرض مرة واحدة.
   * لا يُحفظ المفتاح نصًّا، فما لم يدوّنه التاجر ضاع.
   */
  setPasscode: (passcode: string) => Promise<string>;
  unlock: (passcode: string) => Promise<boolean>;
  /** يفتح اللوحة بمفتاح الاسترجاع، والبيانات كلها باقية. */
  unlockWithRecovery: (key: string) => Promise<boolean>;
  /** يبدّل الرمز بمعرفة الرمز الحالي، ويعيد مفتاح استرجاع جديدًا. */
  changePasscode: (current: string, next: string) => Promise<string | null>;
  lock: () => void;
  touch: () => void;
  clearPasscode: () => void;
}

export const useAdminAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      hash: null,
      salt: null,
      recoveryHash: null,
      recoverySalt: null,
      unlocked: false,
      failedAttempts: 0,
      lockedUntil: null,
      lastActivity: 0,

      setPasscode: async (passcode) => {
        const salt = randomSalt();
        const hash = await derive(passcode, salt);

        const recoveryKey = generateRecoveryKey();
        const recoverySalt = randomSalt();
        const recoveryHash = await derive(normalizeRecoveryKey(recoveryKey), recoverySalt);

        set({
          hash,
          salt,
          recoveryHash,
          recoverySalt,
          unlocked: true,
          failedAttempts: 0,
          lockedUntil: null,
          lastActivity: Date.now(),
        });
        return recoveryKey;
      },

      unlock: async (passcode) => {
        const { hash, salt, lockedUntil, failedAttempts } = get();
        if (lockedUntil && Date.now() < lockedUntil) return false;
        if (!hash || !salt) return false;

        const candidate = await derive(passcode, salt);
        if (candidate === hash) {
          set({
            unlocked: true,
            failedAttempts: 0,
            lockedUntil: null,
            lastActivity: Date.now(),
          });
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

      unlockWithRecovery: async (key) => {
        const { recoveryHash, recoverySalt } = get();
        if (!recoveryHash || !recoverySalt) return false;

        const candidate = await derive(normalizeRecoveryKey(key), recoverySalt);
        if (candidate !== recoveryHash) return false;

        set({ unlocked: true, failedAttempts: 0, lockedUntil: null, lastActivity: Date.now() });
        return true;
      },

      changePasscode: async (current, next) => {
        const { hash, salt } = get();
        if (!hash || !salt) return null;
        const candidate = await derive(current, salt);
        if (candidate !== hash) return null;
        return get().setPasscode(next);
      },

      lock: () => set({ unlocked: false }),

      touch: () => set({ lastActivity: Date.now() }),

      clearPasscode: () =>
        set({
          hash: null,
          salt: null,
          recoveryHash: null,
          recoverySalt: null,
          unlocked: false,
          failedAttempts: 0,
          lockedUntil: null,
        }),
    }),
    {
      name: 'optima.admin.auth',
      // الجلسة المفتوحة لا تُحفظ، فيُطلب الرمز في كل زيارة جديدة.
      partialize: (s) => ({
        hash: s.hash,
        salt: s.salt,
        recoveryHash: s.recoveryHash,
        recoverySalt: s.recoverySalt,
        failedAttempts: s.failedAttempts,
        lockedUntil: s.lockedUntil,
      }),
    },
  ),
);
