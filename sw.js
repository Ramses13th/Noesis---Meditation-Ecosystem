const prefix = 'awareness-hub:' + self.location.pathname + ':';
const cacheName = prefix + 'noesis-v4';
const files = ['./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./sprites.png','./overworld.webp','./relics.webp','./starlight.png','./arcade.ttf','./bronze-frame.webp','./shrine-sprites.webp','./sanctuary.js','./original-reader.js','./sanctuary.css'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(prefix) && name !== cacheName).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.open(cacheName)).match('./index.html')));
    return;
  }
  if (!files.some(file => new URL(file,self.registration.scope).href === request.url)) return;
  event.respondWith((async () => (await (await caches.open(cacheName)).match(request)) || fetch(request))());
});
