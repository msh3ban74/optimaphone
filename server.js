import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync, constants as zlibConstants } from 'node:zlib';

/**
 * ── خادم أوبتيما فون ─────────────────────────────────────────
 *
 * يخدم نسخة الإنتاج المبنية في dist/. بلا أي اعتمادية: ما لا
 * نُدخله لا يحتاج تحديثًا أمنيًا ولا يُفاجئنا يومًا.
 *
 * ما يتكفّل به:
 *   • الرجوع إلى index.html لأي مسار غير معروف، فيعمل التوجيه
 *     داخل المتصفح مهما كان المسار الذي دخل منه الزائر.
 *   • تخزين طويل للأصول المبصومة بالمحتوى، ومنعه عن صفحة الدخول
 *     وعامل الخدمة، وإلا بقي الزوار على نسخة قديمة بعد كل نشر.
 *   • ضغط النصوص مرة واحدة ثم حفظ النتيجة في الذاكرة.
 *   • ترويسات أمنية، وسياسة محتوى تمنع أي طلب إلى خارج النطاق.
 */

const ROOT = resolve(fileURLToPath(new URL('./dist', import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

/** ما يُجدي ضغطه. الصور والخطوط مضغوطة أصلًا فضغطها خسارة. */
const COMPRESSIBLE = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.webmanifest',
  '.svg',
  '.txt',
  '.xml',
  '.map',
]);

/**
 * السياسة ذاتها المعلنة في index.html، تُكرَّر هنا كترويسة لأن
 * ترويسة الخادم أقوى: تسري قبل تحليل الصفحة، ولا سبيل لتعديلها
 * من داخل المحتوى.
 */
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
};

/** ذاكرة الأصول المضغوطة: المفتاح مسارٌ وترميز. */
const compressedCache = new Map();

function contentType(path) {
  return MIME[extname(path).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * يحوّل مسار الطلب إلى مسار ملف داخل dist، ويرفض كل ما يحاول
 * الخروج منه. التحقق يقع على المسار بعد التسوية لا قبلها، فلا
 * تنفع حيل الترميز المزدوج ولا «..» المتسلسلة.
 */
function resolveWithin(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  if (decoded.includes('\0')) return null;

  const candidate = resolve(join(ROOT, normalize(decoded)));
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return null;
  return candidate;
}

/**
 * سياسة التخزين. الأصول تحمل بصمة المحتوى في اسمها، فتغيّرها
 * يغيّر الاسم، ولذا تُخزَّن سنة كاملة بلا مراجعة. وما عداها —
 * وأخصّها index.html و sw.js — يُراجَع في كل مرة، وإلا بقي
 * الزائر على نسخة قديمة إلى الأبد.
 */
function cacheControl(pathname) {
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  if (pathname === '/sw.js' || pathname.endsWith('/index.html') || pathname === '/') {
    return 'no-cache';
  }
  if (pathname.startsWith('/fonts/')) return 'public, max-age=604800';
  return 'public, max-age=3600';
}

function pickEncoding(accept = '') {
  if (/\bbr\b/.test(accept)) return 'br';
  if (/\bgzip\b/.test(accept)) return 'gzip';
  return null;
}

async function compressedBody(filePath, encoding) {
  const key = `${filePath}:${encoding}`;
  const hit = compressedCache.get(key);
  if (hit) return hit;

  const raw = await readFile(filePath);
  const body =
    encoding === 'br'
      ? brotliCompressSync(raw, {
          params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 10 },
        })
      : gzipSync(raw, { level: 8 });

  compressedCache.set(key, body);
  return body;
}

function send(res, status, headers, body) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  if (body === undefined) res.end();
  else res.end(body);
}

async function serveFile(req, res, filePath, pathname, status = 200) {
  const info = await stat(filePath);
  const etag = `W/"${info.size.toString(16)}-${info.mtimeMs.toString(16)}"`;

  const headers = {
    'Content-Type': contentType(filePath),
    'Cache-Control': cacheControl(pathname),
    ETag: etag,
    Vary: 'Accept-Encoding',
  };

  if (req.headers['if-none-match'] === etag) {
    send(res, 304, headers);
    return;
  }

  if (req.method === 'HEAD') {
    send(res, status, { ...headers, 'Content-Length': String(info.size) });
    return;
  }

  const encoding =
    COMPRESSIBLE.has(extname(filePath).toLowerCase()) && info.size > 1024
      ? pickEncoding(req.headers['accept-encoding'])
      : null;

  if (encoding) {
    const body = await compressedBody(filePath, encoding);
    send(res, status, {
      ...headers,
      'Content-Encoding': encoding,
      'Content-Length': String(body.length),
    }, body);
    return;
  }

  res.writeHead(status, {
    ...SECURITY_HEADERS,
    ...headers,
    'Content-Length': String(info.size),
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer((req, res) => {
  void handle(req, res).catch(() => {
    if (!res.headersSent) {
      send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'خطأ في الخادم');
    } else {
      res.destroy();
    }
  });
});

async function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' }, 'غير مسموح');
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = url.pathname;

  // فحص الحياة الذي تستعمله المنصة، خارج تدفّق الملفات.
  if (pathname === '/healthz') {
    send(res, 200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, '{"ok":true}');
    return;
  }

  const filePath = resolveWithin(pathname === '/' ? '/index.html' : pathname);
  if (!filePath) {
    send(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, 'مسار غير صالح');
    return;
  }

  try {
    const info = await stat(filePath);
    if (info.isFile()) {
      await serveFile(req, res, filePath, pathname);
      return;
    }
    if (info.isDirectory()) {
      const indexPath = join(filePath, 'index.html');
      await serveFile(req, res, indexPath, `${pathname}/index.html`);
      return;
    }
  } catch {
    /* غير موجود — يُعالَج أدناه */
  }

  /*
   * الرجوع إلى صفحة الدخول. لا يشمل الأصول: طلب ملف غير موجود
   * تحت assets خطأٌ حقيقي، وإرجاع صفحة HTML مكانه يخفي العلّة
   * ويربك المتصفح.
   */
  if (pathname.startsWith('/assets/') || extname(pathname)) {
    send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'غير موجود');
    return;
  }

  await serveFile(req, res, join(ROOT, 'index.html'), '/index.html', 200);
}

server.listen(PORT, HOST, () => {
  console.log(`أوبتيما فون يعمل على http://${HOST}:${PORT}`);
});

// المنصّة ترسل SIGTERM عند إعادة النشر، فيُغلق الخادم بهدوء
// بعد إتمام ما بين يديه من طلبات.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}
