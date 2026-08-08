import { useState } from 'react';

import { useToastStore } from '../components/bits';
import { STORE } from '../config/store';
import { eraseAllLocalData } from '../store/stores';

export function PrivacyPage() {
  const notify = useToastStore((s) => s.show);
  const [confirming, setConfirming] = useState(false);

  const erase = () => {
    eraseAllLocalData();
    setConfirming(false);
    notify('مُحيت بيانات هذا الجهاز');
  };

  return (
    <div className="wrap narrow section-tight stack-lg">
      <div>
        <p className="eyebrow">{STORE.nameLatin}</p>
        <h1 className="h1">الخصوصية</h1>
        <hr className="gold-rule" />
      </div>

      <dl className="panel">
        <div className="panel-row">
          <dt>مكان حفظ بياناتك</dt>
          <dd>على جهازك وحده</dd>
        </div>
        <div className="panel-row">
          <dt>ما يُحفظ</dt>
          <dd>السلة والمختارات وأرقام الطلبات</dd>
        </div>
        <div className="panel-row">
          <dt>ما لا يُحفظ</dt>
          <dd>الاسم والهاتف والعنوان وصورة الإيصال</dd>
        </div>
        <div className="panel-row">
          <dt>الحسابات</dt>
          <dd>لا يتطلب المتجر تسجيلًا</dd>
        </div>
        <div className="panel-row">
          <dt>التتبّع والإعلانات</dt>
          <dd>لا شيء منها</dd>
        </div>
        <div className="panel-row">
          <dt>الجهات الخارجية</dt>
          <dd>لا خطوط ولا صور ولا نصوص برمجية خارجية</dd>
        </div>
        <div className="panel-row">
          <dt>إرسال الطلب</dt>
          <dd>عبر واتساب، بفعل منك أنت</dd>
        </div>
      </dl>

      <section className="panel panel-pad stack">
        <h2 className="h2">محو بيانات هذا الجهاز</h2>
        <p className="muted small">
          يمحو ما حفظه المتجر في هذا المتصفح محوًا تامًا لا رجعة فيه.
        </p>
        {confirming ? (
          <div className="row wrap-flex">
            <button type="button" className="btn btn-gold grow" onClick={erase}>
              تأكيد المحو
            </button>
            <button
              type="button"
              className="btn btn-quiet grow"
              onClick={() => setConfirming(false)}
            >
              تراجع
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-quiet" onClick={() => setConfirming(true)}>
            محو البيانات
          </button>
        )}
      </section>

      <p className="faint">
        للاستفسار:{' '}
        <a
          className="link-gold"
          href={`https://wa.me/${STORE.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          واتساب {STORE.transferNumberLocal}
        </a>
      </p>
    </div>
  );
}
