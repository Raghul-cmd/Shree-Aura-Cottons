// Register Service Worker for PWA Mobile App Experience
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) installBtn.style.display = 'block';
});

function setupMobile() {
    ensureMobileElements();
    initMobileBottomNav();
    updateMobileBadges();
    initMobileNavDrawer();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobile);
} else {
    setupMobile();
}

function ensureMobileElements() {
    // 1. Inject Mobile Navigation Drawer & Overlay if not present
    if (!document.getElementById('mobileDrawer')) {
        const drawerHTML = `
            <div class="mobile-nav-overlay" id="mobileNavOverlay"></div>
            <div class="mobile-drawer" id="mobileDrawer">
                <div class="mobile-drawer-header">
                    <span style="font-family:var(--font-heading); font-size:0.95rem; color:var(--primary-maroon); font-weight:800; letter-spacing:0.5px;">SHREE AURA COTTONS</span>
                    <button class="mobile-filter-close" id="mobileNavClose">✕</button>
                </div>
                <ul class="mobile-menu-links">
                    <li><a href="index.html">🏠 Home</a></li>
                    <li><a href="shop.html">👗 Shop All Sarees</a></li>
                    <li><a href="shop.html?category=cotton-sarees">🌿 Cotton Sarees</a></li>
                    <li><a href="shop.html?category=silk-sarees">✨ Pure Silk Sarees</a></li>
                    <li><a href="shop.html?category=banarasi-sarees">👑 Banarasi Sarees</a></li>
                    <li><a href="shop.html?category=daily-wear">🌸 Daily Wear Collection</a></li>
                    <li><a href="shop.html?category=wedding-sarees">💍 Wedding Heritage</a></li>
                    <li><a href="wishlist.html">💖 My Saved Wishlist</a></li>
                    <li><a href="cart.html">🛒 Shopping Cart</a></li>
                    <li><a href="login.html">👤 Customer Account</a></li>
                    <li><a href="#" id="installAppBtn" style="color:var(--primary-maroon); font-weight:800; display:none;">📲 Install Mobile App</a></li>
                </ul>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', drawerHTML);

        document.getElementById('installAppBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(() => {
                    deferredPrompt = null;
                });
            }
        });
    }

    // 2. Inject Mobile Hamburger Toggle Button in Header if missing
    const headerInner = document.querySelector('.main-header .header-inner');
    if (headerInner && !document.getElementById('mobileNavToggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-nav-toggle';
        toggleBtn.id = 'mobileNavToggle';
        toggleBtn.setAttribute('aria-label', 'Open navigation menu');
        toggleBtn.innerHTML = '☰';
        headerInner.insertAdjacentElement('afterbegin', toggleBtn);
    }
}

function initMobileBottomNav() {
    if (document.querySelector('.mobile-bottom-nav')) return;

    const currentPath = window.location.pathname.toLowerCase();
    
    const isHome = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '' || currentPath.endsWith('weavessareecollections') || currentPath.endsWith('shree-aura-cottons') || currentPath.endsWith('shreeauracottons');
    const isShop = currentPath.includes('shop.html') || currentPath.includes('product.html');
    const isWishlist = currentPath.includes('wishlist.html');
    const isCart = currentPath.includes('cart.html') || currentPath.includes('checkout.html');
    const isAccount = currentPath.includes('login.html');

    const navHTML = `
        <nav class="mobile-bottom-nav" aria-label="Mobile Navigation">
            <a href="index.html" class="${isHome ? 'active' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span>Home</span>
            </a>
            <a href="shop.html" class="${isShop ? 'active' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span>Shop</span>
            </a>
            <a href="wishlist.html" class="${isWishlist ? 'active' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                <span>Wishlist</span>
                <span class="badge" id="mobileNavWishlistBadge" style="display:none;">0</span>
            </a>
            <a href="cart.html" class="${isCart ? 'active' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span>Cart</span>
                <span class="badge" id="mobileNavCartBadge" style="display:none;">0</span>
            </a>
            <a href="login.html" class="${isAccount ? 'active' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>Account</span>
            </a>
        </nav>
    `;

    document.body.insertAdjacentHTML('beforeend', navHTML);
}

export function updateMobileBadges() {
    try {
        const cart = getCart();
        const cartCount = cart ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
        const cartBadges = [document.getElementById('cartCountBadge'), document.getElementById('mobileNavCartBadge')];
        cartBadges.forEach(badge => {
            if (badge) {
                if (cartCount > 0) {
                    badge.textContent = cartCount;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    } catch(e) {}

    try {
        const wishlist = getWishlist();
        const wishCount = wishlist ? wishlist.length : 0;
        const wishBadges = [document.getElementById('wishlistCountBadge'), document.getElementById('mobileNavWishlistBadge')];
        wishBadges.forEach(badge => {
            if (badge) {
                if (wishCount > 0) {
                    badge.textContent = wishCount;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    } catch(e) {}
}

function initMobileNavDrawer() {
    const toggle = document.getElementById('mobileNavToggle');
    const close = document.getElementById('mobileNavClose');
    const overlay = document.getElementById('mobileNavOverlay');
    const drawer = document.getElementById('mobileDrawer');

    if (toggle && drawer && overlay) {
        toggle.addEventListener('click', () => {
            drawer.classList.add('active');
            overlay.classList.add('active');
        });

        const closeDrawer = () => {
            drawer.classList.remove('active');
            overlay.classList.remove('active');
        };

        close?.addEventListener('click', closeDrawer);
        overlay.addEventListener('click', closeDrawer);
    }
}

window.addEventListener('storage', updateMobileBadges);
