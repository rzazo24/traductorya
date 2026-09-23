// Sirve /sw.js (vía el rewrite en vercel.json) generándolo en cada
// petición, en vez de como archivo estático. Así CACHE_VERSION sale del
// hash de commit de cada despliegue (VERCEL_GIT_COMMIT_SHA, que Vercel
// rellena solo) y el aviso de "nueva versión disponible" se dispara en
// todos los despliegues, sin tener que acordarse de tocar este archivo.
const CACHE_VERSION = process.env.VERCEL_GIT_COMMIT_SHA || 'dev';

const SW_SCRIPT = `
const CACHE_NAME = 'traductorya-${CACHE_VERSION}';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // La API nunca se cachea: es dinámica y depende de la sesión.
  if (url.pathname.startsWith('/api/')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
`;

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).end(SW_SCRIPT);
};
