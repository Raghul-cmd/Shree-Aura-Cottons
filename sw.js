// ==============================================================================
// SHREE AURA COTTONS - SERVICE WORKER & APP OFFLINE ENGINE
// ==============================================================================

const CACHE_NAME = 'shree-aura-v10-clean-wishlist';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Network first for all requests
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
