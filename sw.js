// ==============================================================================
// SHREE AURA COTTONS - SERVICE WORKER & APP OFFLINE ENGINE
// ==============================================================================

const CACHE_NAME = 'shree-aura-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './shop.html',
    './product.html',
    './cart.html',
    './wishlist.html',
    './checkout.html',
    './login.html',
    './css/style.css',
    './css/responsive.css',
    './js/mobile.js',
    './js/products.js',
    './js/shop.js',
    './assets/logo.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request).catch(() => {
            return caches.match(e.request);
        })
    );
});
