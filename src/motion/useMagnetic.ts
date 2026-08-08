import { useEffect, useRef } from 'react';

import { gsap, prefersReducedMotion, registerMotion } from './gsap';

/**
 * جاذبيةٌ مغناطيسية: ينجذب العنصر نحو المؤشّر انجذابًا خفيفًا ثم
 * يرتدّ إلى موضعه بارتداد مرن عند المغادرة.
 *
 * تُعطَّل على الأجهزة اللمسية — إذ لا مؤشّر فيها — وعند تفضيل
 * تقليل الحركة.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.32) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    registerMotion();

    const label = el.querySelector<HTMLElement>('[data-magnetic-label]') ?? el;

    const moveX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const moveY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const labelX = gsap.quickTo(label, 'x', { duration: 0.65, ease: 'power3.out' });
    const labelY = gsap.quickTo(label, 'y', { duration: 0.65, ease: 'power3.out' });

    const onMove = (event: PointerEvent) => {
      const box = el.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height / 2);
      moveX(dx * strength);
      moveY(dy * strength);
      // النص يتأخّر قليلًا خلف الزر، فيبدو للحركة عمق
      labelX(dx * strength * 0.35);
      labelY(dy * strength * 0.35);
    };

    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.75, ease: 'elastic.out(1, 0.36)' });
      gsap.to(label, { x: 0, y: 0, duration: 0.75, ease: 'elastic.out(1, 0.36)' });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf([el, label]);
      gsap.set([el, label], { clearProps: 'transform' });
    };
  }, [strength]);

  return ref;
}
