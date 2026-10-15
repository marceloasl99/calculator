const CACHE_NAME = 'scicalc-pro-v2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './standalone.html',
  './manifest.json',
  './assets/icons/calculator.svg',
  './css/themes.css',
  './css/styles.css',
  './css/responsive.css',
  './js/app.js',
  './js/state.js',
  './js/calculator-engine.js',
  './js/expression-parser.js',
  './js/formatting.js',
  './js/history.js',
  './js/storage.js',
  './js/keyboard.js',
  './js/i18n.js',
  './js/unit-conversions.js',
  './js/tools/complex.js',
  './js/tools/matrices.js',
  './js/tools/statistics.js',
  './js/tools/equation-solver.js',
  './js/tools/calculus.js',
  './js/tools/number-theory.js',
  './locales/en.json',
  './locales/es.json',
  './locales/pt-BR.json',
  './locales/it.json',
  './locales/fr.json',
  './locales/de.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
