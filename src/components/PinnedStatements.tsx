import { useEffect, useRef } from 'react';

import { ScrollTrigger, gsap, prefersReducedMotion, registerMotion } from '../motion/gsap';

/**
 * قسمٌ مثبَّت: يبقى في المرأى بينما يتقدّم المحتوى داخله عبارةً بعد
 * أخرى مع التمرير، ويتحرّك خطُّ التقدّم معها.
 *
 * التثبيت هنا بـ position: sticky لا بخاصية pin في ScrollTrigger،
 * لأن الأخيرة تُعيد بناء الشجرة وتنقل القسم إلى غلافٍ جديد، فتفشل
 * React في إزالته عند الانتقال إلى صفحةٍ أخرى. أما sticky فلا يمسّ
 * الشجرة البتة، ويؤدي المعنى نفسه.
 *
 * عند تفضيل تقليل الحركة أو ضيق الشاشة يُعرض المحتوى قائمةً عادية.
 */

const STATEMENTS = [
  {
    index: '٠١',
    title: 'انتقاءٌ لا مساومة فيه',
    body: 'لا يدخل معروضاتنا صنفٌ لم نفحصه ونطمئنَّ إلى أصله وضمانه.',
  },
  {
    index: '٠٢',
    title: 'سعرٌ معلنٌ بلا مواربة',
    body: 'ما تراه هو ما تدفعه؛ لا رسومَ خفيّة ولا أسعارَ تتبدّل عند الطلب.',
  },
  {
    index: '٠٣',
    title: 'عنايةٌ تدوم بعد البيع',
    body: 'علاقتنا بك تبدأ عند التسليم ولا تنتهي عنده.',
  },
];

export function PinnedStatements() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    if (prefersReducedMotion() || window.innerWidth < 860) {
      el.classList.add('is-static');
      return;
    }

    registerMotion();

    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>('.pin-panel');
      const total = panels.length;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // العبارة الأولى وحدها ظاهرة ابتداءً، وما بعدها مُخفًى
      gsap.set(panels, { opacity: 0, yPercent: 42 });
      gsap.set(panels[0], { opacity: 1, yPercent: 0 });

      // خروجٌ يكتمل قبل الدخول، فلا تُقرأ عبارتان معًا
      panels.forEach((panel, i) => {
        if (i >= total - 1) return;
        tl.to(panel, { opacity: 0, yPercent: -32, duration: 0.4, ease: 'power2.in' }, i + 0.6);
        // تداخلٌ يسير يمنع وميض المسرح فارغًا بين العبارتين
        tl.to(
          panels[i + 1],
          { opacity: 1, yPercent: 0, duration: 0.4, ease: 'power2.out' },
          i + 0.86,
        );
      });

      tl.fromTo(
        '.pin-progress-bar',
        { scaleX: 1 / total },
        { scaleX: 1, ease: 'none', duration: tl.duration() },
        0,
      );
    }, el);

    // إعادة الحساب بعد تحميل الخطوط، إذ يتبدّل ارتفاع النص
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, []);

  return (
    <section className="pin" ref={root} aria-label="التزاماتنا">
      <div className="wrap pin-inner">
        <p className="eyebrow">التزاماتنا</p>

        <div className="pin-stage">
          {STATEMENTS.map((s) => (
            <article className="pin-panel" key={s.index}>
              <span className="pin-index" aria-hidden="true">
                {s.index}
              </span>
              <h2 className="pin-title">{s.title}</h2>
              <p className="pin-body">{s.body}</p>
            </article>
          ))}
        </div>

        <div className="pin-progress" aria-hidden="true">
          <span className="pin-progress-bar" />
        </div>
      </div>
    </section>
  );
}
