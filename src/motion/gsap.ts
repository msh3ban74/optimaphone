import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * ── طبقة الحركة ──────────────────────────────────────────────
 *
 * تُسجَّل الإضافات مرة واحدة. تعمل GSAP عبر واجهة CSSOM لا عبر
 * أنماط مضمَّنة في الترميز، فتبقى سياسة أمن المحتوى صارمة كما هي.
 */

let registered = false;

export function registerMotion(): void {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  registered = true;
}

/** يحترم تفضيل تقليل الحركة في نظام المستخدم. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export { gsap, ScrollTrigger, SplitText };
