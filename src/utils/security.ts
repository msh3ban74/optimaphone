import { RECEIPT_LIMITS } from '../config/store';

/**
 * ── طبقة التحقق والتطهير ──────────────────────────────────────
 *
 * كل نص يدخل من المستخدم يمر من هنا قبل استعماله في أي سياق.
 * المتجر لا يرسل بيانات إلى أي خادم، غير أن التطهير يمنع حقن
 * محارف التحكم أو الروابط الخبيثة أو الإفراط في الطول.
 */

/**
 * محارف التحكم وعلامات اتجاه النص التي تُستغل في التمويه البصري.
 * مطابقة محارف التحكم هنا مقصودة: إزالتها هي الغرض من هذا النمط.
 */
// eslint-disable-next-line no-control-regex -- إزالة محارف التحكم هي غرض النمط
const CONTROL_AND_BIDI = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** يزيل محارف التحكم ويقلّص الفراغات ويحدّ الطول. */
export function sanitizeText(value: string, maxLength = 200): string {
  return value
    .replace(CONTROL_AND_BIDI, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** تطهير نص متعدد الأسطر مع الإبقاء على فواصل الأسطر. */
export function sanitizeMultiline(value: string, maxLength = 500): string {
  return value
    .replace(CONTROL_AND_BIDI, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

/** لا يُسمح إلا بروابط https المطلقة أو المسارات الداخلية. */
export function isSafeUrl(url: string): boolean {
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * صور مرفوعة من جهاز التاجر، مضمَّنة في البيانات ذاتها.
 * الصيغ النقطية وحدها؛ ‏svg مستبعد لأنه يحمل شفرة قابلة للتنفيذ.
 */
const INLINE_IMAGE = /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/;

/**
 * مسار صورة داخلي، أو صورة مضمَّنة رفعها التاجر.
 * يمنع الروابط الخارجية وبروتوكولات التنفيذ.
 */
export function safeImagePath(path: string): string | null {
  if (typeof path !== 'string') return null;
  if (INLINE_IMAGE.test(path)) return path;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (path.includes('..')) return null;
  return path;
}

/** قيمة لونية بصيغة سداسية عشرية فقط. */
export function safeHexColor(hex: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000';
}

/* ── الهواتف ─────────────────────────────────────────────────── */

/** يُبقي الأرقام فقط، ويحوّل الأرقام العربية الهندية إلى لاتينية. */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, '');
}

/**
 * يتحقق من رقم هاتف مصري ويعيده بالصيغة المحلية (11 خانة).
 * يقبل الصيغ: 01XXXXXXXXX و 201XXXXXXXXX و +201XXXXXXXXX.
 */
export function normalizeEgyptianPhone(value: string): string | null {
  let digits = normalizeDigits(value);
  if (digits.startsWith('20')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^1[0125]\d{8}$/.test(digits)) return null;
  return `0${digits}`;
}

export function isValidEgyptianPhone(value: string): boolean {
  return normalizeEgyptianPhone(value) !== null;
}

/** يحوّل رقمًا محليًا إلى الصيغة الدولية المستعملة في روابط الواتساب. */
export function toInternational(local: string): string | null {
  const normalized = normalizeEgyptianPhone(local);
  return normalized ? `20${normalized.slice(1)}` : null;
}

/* ── المبالغ ─────────────────────────────────────────────────── */

/** يحوّل مدخلًا نصيًا إلى مبلغ صالح، أو null إن كان غير مقبول. */
export function parseAmount(value: string): number | null {
  const digits = value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^\d.]/g, '');
  if (digits === '') return null;
  const amount = Number(digits);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return null;
  return Math.round(amount * 100) / 100;
}

/* ── إيصال التحويل ───────────────────────────────────────────── */

export type ReceiptRejection = 'type' | 'size' | 'content';

export interface ReceiptCheck {
  ok: boolean;
  reason?: ReceiptRejection;
}

/** التوقيعات الثنائية المقبولة، للتحقق من المحتوى لا الامتداد. */
const MAGIC_SIGNATURES: Array<{ bytes: number[]; offset: number }> = [
  { bytes: [0xff, 0xd8, 0xff], offset: 0 }, // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 }, // PNG
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // WEBP (RIFF)
];

/**
 * يتحقق من الإيصال بثلاثة معايير: النوع المعلن، والحجم، والتوقيع
 * الثنائي الفعلي للملف. لا يُرفع الملف إلى أي جهة، ولا يُحفظ.
 */
export async function verifyReceiptFile(file: File): Promise<ReceiptCheck> {
  const accepted: readonly string[] = RECEIPT_LIMITS.acceptedTypes;
  if (!accepted.includes(file.type)) return { ok: false, reason: 'type' };
  if (file.size === 0 || file.size > RECEIPT_LIMITS.maxBytes) {
    return { ok: false, reason: 'size' };
  }

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const matches = MAGIC_SIGNATURES.some(({ bytes, offset }) =>
    bytes.every((b, i) => head[offset + i] === b),
  );
  return matches ? { ok: true } : { ok: false, reason: 'content' };
}

/* ── حماية الإطارات ──────────────────────────────────────────── */

/**
 * يمنع تضمين المتجر داخل إطار في موقع آخر، وهو ما يُستغل في
 * خداع النقر. يُستدعى مرة واحدة عند الإقلاع.
 */
export function enforceTopLevelFrame(): void {
  if (window.top !== window.self) {
    window.top?.location.replace(window.location.href);
  }
}
