import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from './App';
import { enforceTopLevelFrame } from './utils/security';
import './styles/global.css';
import './styles/admin.css';

// يُمنع تضمين المتجر داخل إطار خارجي قبل رسم أي محتوى.
enforceTopLevelFrame();

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  );
}

// تسجيل عامل الخدمة للتخزين المؤقت وتشغيل المتجر دون اتصال.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* التخزين المؤقت غير متاح — يعمل المتجر من الشبكة */
    });
  });
}
