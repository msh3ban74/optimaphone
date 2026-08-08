/*
 * عامل الخدمة — التخزين المؤقت وتشغيل المتجر دون اتصال.
 *
 * الأصول المُبصَمة بالمحتوى تُخدم من المخزن مباشرة، أما صفحة
 * الدخول فتُطلب من الشبكة أولًا لضمان أحدث نسخة، مع الرجوع إلى
 * المخزن عند انقطاع الاتصال.
 */

const VERSION = 'optima-v1';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(['./', './index.html']))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL && key !== ASSETS)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // لا يُخزَّن إلا ما كان من نطاق المتجر نفسه.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() =>
          caches.match('./index.html').then((cached) => cached ?? Response.error()),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(ASSETS).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
