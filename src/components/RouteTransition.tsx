import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { ScrollTrigger, gsap, prefersReducedMotion, registerMotion } from '../motion/gsap';

/**
 * انتقالٌ بين الصفحات.
 *
 * عند تبدّل المسار تنساب ستارةٌ ذهبية عبر الشاشة، ويطلع المحتوى
 * الجديد من خلفها. يُتجاهَل الانتقال في أول عرضٍ للصفحة كي لا
 * يزاحم حركة الواجهة الافتتاحية.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const veil = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    const veilEl = veil.current;
    const contentEl = content.current;
    if (!veilEl || !contentEl) return;
    if (prefersReducedMotion()) return;

    registerMotion();

    const tl = gsap.timeline({
      onComplete: () => ScrollTrigger.refresh(),
    });

    tl.set(veilEl, { transformOrigin: 'right center' })
      .fromTo(
        veilEl,
        { scaleX: 0, opacity: 1 },
        { scaleX: 1, duration: 0.42, ease: 'power3.inOut' },
      )
      .set(veilEl, { transformOrigin: 'left center' })
      .to(veilEl, { scaleX: 0, duration: 0.5, ease: 'power3.inOut' }, '+=0.04')
      .from(
        contentEl,
        { y: 26, opacity: 0, duration: 0.6, ease: 'power3.out' },
        '-=0.34',
      );

    return () => {
      tl.kill();
      gsap.set(veilEl, { scaleX: 0 });
    };
  }, [location.pathname]);

  return (
    <>
      <div className="route-veil" ref={veil} aria-hidden="true" />
      <div ref={content}>{children}</div>
    </>
  );
}
