import Lenis from 'lenis';
import { useEffect } from 'react';

import { ScrollTrigger, gsap, prefersReducedMotion, registerMotion } from './gsap';

/**
 * تمريرٌ انسيابي مربوط بحلقة رسم GSAP، فتتزامن الحركة المرتبطة
 * بالتمرير مع موضع الصفحة تزامنًا تامًّا بلا تقطيع.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    registerMotion();

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // اللمس يُترك لسلوك النظام، فهو أدق على الأجهزة المحمولة.
      syncTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}
