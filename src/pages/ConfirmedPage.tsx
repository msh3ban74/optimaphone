import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { paymentChannel } from '../config/store';
import { useActiveOrderStore } from '../store/stores';
import { formatPrice } from '../utils/format';
import { buildOrderMessage, storeWhatsappLink } from '../utils/whatsapp';

export function ConfirmedPage() {
  const order = useActiveOrderStore((s) => s.order);
  const receiptFile = useActiveOrderStore((s) => s.receiptFile);
  const [sharing, setSharing] = useState(false);

  if (!order) return <Navigate to="/" replace />;

  const message = buildOrderMessage(order);
  const link = storeWhatsappLink(message);
  const channel = paymentChannel(order.payment);

  /**
   * عند توفر واجهة المشاركة في المتصفح تُرسل صورة الإيصال مع نص
   * الطلب في خطوة واحدة، وإلا فُتح الواتساب بنص الطلب.
   */
  const send = async () => {
    if (receiptFile && typeof navigator.canShare === 'function') {
      const payload = { files: [receiptFile], text: message };
      if (navigator.canShare(payload)) {
        setSharing(true);
        try {
          await navigator.share(payload);
          return;
        } catch {
          /* أُلغيت المشاركة — يُفتح الواتساب بالنص */
        } finally {
          setSharing(false);
        }
      }
    }
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="wrap narrow section-tight center-text stack-lg">
      <div>
        <p className="done-ring" aria-hidden="true">
          ✓
        </p>
        <h1 className="h1">تم تسجيل طلبكم</h1>
        <p className="lede center-text">
          يسعدنا إتمام طلبكم لدى أوبتيما فون.
        </p>
      </div>

      <dl className="panel">
        <div className="panel-row">
          <dt>رقم الطلب</dt>
          <dd className="ltr tnum">{order.number}</dd>
        </div>
        {order.lines.map((item) => (
          <div key={`${item.productName}-${item.variantLabel}`} className="panel-row">
            <dt>
              {item.quantity} × {item.productName}
            </dt>
            <dd className="tnum">{formatPrice(item.unitPrice * item.quantity)}</dd>
          </div>
        ))}
        <div className="panel-row">
          <dt>السداد</dt>
          <dd>{channel?.label}</dd>
        </div>
        <div className="panel-row">
          <dt className="strong">الإجمالي</dt>
          <dd className="tnum">{formatPrice(order.total)}</dd>
        </div>
      </dl>

      <div className="stack">
        <button
          type="button"
          className="btn btn-whatsapp btn-block btn-lg"
          onClick={() => void send()}
          disabled={sharing}
        >
          إرسال تفاصيل الطلب عبر واتساب
        </button>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="link-quiet"
        >
          فتح المحادثة مباشرة
        </a>
      </div>

      <div className="row wrap-flex">
        <Link to="/shop" className="btn btn-quiet grow">
          متابعة التصفّح
        </Link>
        <Link to="/" className="btn btn-quiet grow">
          الواجهة
        </Link>
      </div>
    </div>
  );
}
