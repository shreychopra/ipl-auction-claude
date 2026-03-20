// IPL 2026 Service Worker
const CACHE = 'ipl-v1';
const STATIC = [
  './index.html',
  './fantasy.html',
  './manifest.json'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(STATIC); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Network first for Firebase/API calls, cache first for static assets
  var url = e.request.url;
  if(url.includes('firebase') || url.includes('rapidapi') || url.includes('workers.dev')){
    e.respondWith(fetch(e.request).catch(function(){ return caches.match(e.request); }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(resp){
        // Cache images from our repo
        if(url.includes('/images/')){
          caches.open(CACHE).then(function(c){ c.put(e.request, resp.clone()); });
        }
        return resp;
      });
    })
  );
});
