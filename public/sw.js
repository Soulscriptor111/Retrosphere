const CACHE_NAME = 'retrosphere-shell-v1'
const APP_SHELL = [
  '/',
  '/index.html',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Cache-first for the app shell + static assets; network for everything else,
// falling back to cache if offline. Audio files stay in IndexedDB, not here.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            // Only cache same-origin static assets, not API/audio blobs
            if (request.url.startsWith(self.location.origin)) {
              cache.put(request, copy)
            }
          })
          return response
        })
        .catch(() => caches.match('/index.html'))
    })
  )
})
