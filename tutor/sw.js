// Guarda la app para que funcione sin internet. Sube la versión al cambiar archivos.
var CACHE = 'lumi-mates-v3';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === location.origin;
  var isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return; // la API de IA y otros van directos a la red
  e.respondWith(
    fetch(req).then(function(res){
      if (res && (res.ok || res.type === 'opaque')){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(r){ return r || (req.mode === 'navigate' ? caches.match('index.html') : undefined); });
    })
  );
});
