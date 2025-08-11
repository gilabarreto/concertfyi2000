const CACHE_NAME = 'geolocation-v1';
const API_CACHE_NAME = 'api-responses';

self.addEventListener('fetch', (event) => {
  // Cache de geolocalização
  if (event.request.url.includes('nominatim.openstreetmap.org')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
  
  // Cache para APIs de concertos
  if (event.request.url.includes('api.ticketmaster.com') || 
      event.request.url.includes('api.setlist.fm')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cached) => {
          const fetched = fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetched;
        });
      })
    );
  }
});