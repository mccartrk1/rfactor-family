// R Factor Family App — Service Worker
// Version: 1.0.0
//
// STRATEGY:
//   Static assets (JS, CSS, fonts): Cache First — these never change for a given URL
//   Pages (HTML): Network First with offline fallback — show cached if offline
//   API calls: Network Only — never cache API responses in SW (data must be fresh)
//   Lesson content: Cache on first load — allows offline lesson completion
//
// This service worker makes the app installable as a PWA and usable offline
// for lessons that have already been loaded.

const CACHE_NAME = 'rfactor-v1'
const OFFLINE_URL = '/dashboard'

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/offline.html',
]

// ── Install: precache core assets ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch: routing strategy ───────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept API calls
  if (url.pathname.startsWith('/api/')) return

  // Never intercept NextAuth
  if (url.pathname.startsWith('/api/auth/')) return

  // Static assets: cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      }))
    )
    return
  }

  // Pages: network first, fall back to cache, fall back to offline page
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request) || caches.match(OFFLINE_URL))
  )
})
