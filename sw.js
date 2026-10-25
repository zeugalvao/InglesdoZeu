/* Inglês do Zeu — service worker: abre rápido e funciona sem internet */
const CACHE = 'zeu-app-v4';
const V = '?v=3';
const SHELL = ['./', './index.html', './manifest.webmanifest'+V,
  './icons/icon-192.png'+V, './icons/icon-512.png'+V, './icons/icon-maskable-512.png'+V, './icons/apple-touch-icon.png'+V, './icons/favicon-32.png'+V];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const fonte = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  const lib = url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('@supabase/supabase-js');
  if (!same && !fonte && !lib) return;               /* banco, tradução e vídeos vão direto para a internet */
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    /* página: tenta a versão nova primeiro; sem internet, usa a guardada */
    e.respondWith(fetch(req, {cache:'no-cache'}).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  /* ícones, fontes e biblioteca: usa a guardada e atualiza em segundo plano */
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
