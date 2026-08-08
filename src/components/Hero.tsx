import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { STORE } from '../config/store';
import { SplitText, gsap, prefersReducedMotion, registerMotion } from '../motion/gsap';

/**
 * الواجهة الافتتاحية.
 *
 * يُقطَّع العنوان بـ SplitText إلى أسطرٍ ثم كلمات، فتصعد كل كلمة من
 * خلف قناعٍ يخفي ما دونها، بتتابعٍ محسوب يجعل الجملة تُركَّب أمام
 * العين كلمةً كلمة. ثم يمرّ لمعانٌ ذهبي فوقها.
 *
 * تعمل GSAP عبر واجهة CSSOM، فلا تُستعمل أنماطٌ مضمَّنة وتبقى سياسة
 * أمن المحتوى صارمة.
 */

const HEADLINE = 'أناقةٌ تُلمَس، وتقنيةٌ لا تُضاهى';

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const titleEl = title.current;
    const rootEl = root.current;
    if (!titleEl || !rootEl) return;

    if (prefersReducedMotion()) {
      titleEl.textContent = HEADLINE;
      titleEl.classList.add('is-ready');
      return;
    }

    registerMotion();

    // يُكتب النص هنا لا في الترميز، فيبقى هذا العنصر خارج مصالحة
    // React؛ إذ يعيد SplitText بناء أبنائه، ولو كانت React تتتبّعهم
    // لأخفقت في إزالتهم عند الانتقال إلى صفحة أخرى.
    titleEl.textContent = HEADLINE;

    const ctx = gsap.context(() => {
      const split = new SplitText(titleEl, {
        type: 'lines,words',
        linesClass: 'split-line',
        wordsClass: 'split-word',
      });

      titleEl.classList.add('is-ready');

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl.from(split.words, {
        yPercent: 118,
        rotate: 5,
        opacity: 0,
        filter: 'blur(12px)',
        duration: 1.25,
        stagger: 0.085,
      })
        .to('.hero-sheen', { xPercent: 220, duration: 1.5, ease: 'power2.inOut' }, '-=0.65')
        .from(
          ['.hero-eyebrow', '.hero-lede', '.hero-cta', '.hero-marks'],
          { y: 26, opacity: 0, duration: 0.95, stagger: 0.12 },
          '-=1.5',
        );

      // انسياقٌ خفيف للشفق مع التمرير
      gsap.to('.hero-aurora', {
        yPercent: 22,
        ease: 'none',
        scrollTrigger: { trigger: rootEl, start: 'top top', end: 'bottom top', scrub: true },
      });

      return () => split.revert();
    }, rootEl);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" ref={root}>
      <div className="hero-aurora" aria-hidden="true">
        <span className="aurora aurora-1" />
        <span className="aurora aurora-2" />
        <span className="aurora aurora-3" />
      </div>
      <div className="hero-grid" aria-hidden="true" />

      <div className="wrap hero-inner">
        <p className="hero-eyebrow">
          <span className="hero-dot" aria-hidden="true" />
          {STORE.nameLatin}
        </p>

        <h1 className="hero-title">
          <span className="sr-only">{HEADLINE}</span>
          {/* عنصرٌ فارغٌ في الترميز عمدًا — يملؤه SplitText وحده */}
          <span className="hero-title-text" ref={title} aria-hidden="true" />
          <span className="hero-sheen" aria-hidden="true" />
        </h1>

        <p className="hero-lede">
          أجهزةٌ مُنتقاةٌ بعناية، وأسعارٌ معلنةٌ بلا مواربة، وضمانٌ معتمدٌ يرافق كل صنف.
        </p>

        <div className="hero-cta">
          <Link to="/shop" className="btn btn-gold btn-lg">
            تصفّح المعروضات
            <span className="btn-arrow" aria-hidden="true">
              ←
            </span>
          </Link>
          <a
            href={`https://wa.me/${STORE.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-glass btn-lg"
          >
            تواصل معنا
          </a>
        </div>

        <dl className="hero-marks">
          <div className="hero-mark">
            <dt>الضمان</dt>
            <dd>معتمدٌ وموثّق</dd>
          </div>
          <div className="hero-mark">
            <dt>السداد</dt>
            <dd>إنستاباي · محفظة · عند الاستلام</dd>
          </div>
          <div className="hero-mark">
            <dt>الخصوصية</dt>
            <dd>بياناتك لا تغادر جهازك</dd>
          </div>
        </dl>
      </div>

      <div className="hero-ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((pass) => (
            <span key={pass} className="ticker-run">
              <span className="ticker-item">توصيلٌ إلى كل المحافظات</span>
              <span className="ticker-sep">◆</span>
              <span className="ticker-item">ضمانٌ معتمد</span>
              <span className="ticker-sep">◆</span>
              <span className="ticker-item">أجهزةٌ أصلية</span>
              <span className="ticker-sep">◆</span>
              <span className="ticker-item">سدادٌ عند الاستلام</span>
              <span className="ticker-sep">◆</span>
              <span className="ticker-item">خدمةٌ بعد البيع</span>
              <span className="ticker-sep">◆</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
