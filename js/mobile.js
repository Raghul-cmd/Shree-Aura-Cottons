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
    initWelcomeAccountModal();
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
                    <li><a href="wishlist.html?tab=orders">📦 My Orders Catalog</a></li>
                    <li><a href="wishlist.html?tab=wishlist">💖 My Saved Wishlist</a></li>
                    <li><a href="shop.html?category=wedding-sarees">💍 Wedding Sarees</a></li>
                    <li><a href="shop.html?category=office-wear">💼 Office Wear</a></li>
                    <li><a href="shop.html?category=daily-wear">🌸 Daily Wear Collection</a></li>
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
            <a href="wishlist.html?tab=orders" class="${isWishlist ? 'active' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span>Orders</span>
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
        const cartStr = localStorage.getItem('vw_cart');
        const cart = cartStr ? JSON.parse(cartStr) : [];
        const cartCount = cart ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
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
        const wishStr = localStorage.getItem('vw_wishlist');
        const wishlist = wishStr ? JSON.parse(wishStr) : [];
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
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('#mobileNavToggle') || e.target.closest('.mobile-nav-toggle');
        const closeBtn = e.target.closest('#mobileNavClose') || e.target.closest('.mobile-filter-close');
        const overlay = e.target.closest('#mobileNavOverlay');

        const drawer = document.getElementById('mobileDrawer');
        const navOverlay = document.getElementById('mobileNavOverlay');

        if (toggleBtn) {
            e.preventDefault();
            drawer?.classList.add('active');
            navOverlay?.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else if (closeBtn || overlay) {
            drawer?.classList.remove('active');
            navOverlay?.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

function initWelcomeAccountModal() {
    const hasSession = localStorage.getItem('vw_session');
    const dismissed = sessionStorage.getItem('sa_welcome_dismissed');

    // Only show pop-up modal for new visitors without an account on homepage or main shop pages
    const path = window.location.pathname.toLowerCase();
    const isMainPage = path.endsWith('index.html') || path.endsWith('/') || path.endsWith('shop.html');

    if (!hasSession && !dismissed && isMainPage) {
        setTimeout(() => {
            if (document.getElementById('welcomePopupModal')) return;

            const modalHTML = `
                <div id="welcomePopupModal" style="position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:1900; display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn 0.3s ease;">
                    <div style="background:var(--bg-white); border-radius:var(--radius-lg); padding:2rem; max-width:440px; width:100%; text-align:center; box-shadow:var(--shadow-lg); border:2px solid var(--gold-accent); position:relative;">
                        <button id="closeWelcomePopup" style="position:absolute; top:12px; right:16px; background:none; border:none; font-size:1.4rem; cursor:pointer; color:var(--text-muted);">✕</button>
                        
                        <div style="font-size:2.8rem; margin-bottom:0.5rem;">🌸</div>
                        <h3 style="font-family:var(--font-heading); font-size:1.6rem; color:var(--primary-maroon); margin:0 0 0.5rem; font-weight:800;">Welcome to Shree Aura!</h3>
                        <p style="color:var(--text-muted); font-size:0.88rem; margin:0 0 1.5rem; font-weight:500; line-height:1.5;">
                            Create a free account or sign in to track your saree order catalog, delivery updates & saved wishlist!
                        </p>

                        <div style="display:flex; flex-direction:column; gap:0.75rem;">
                            <a href="login.html" class="btn btn-primary" style="padding:0.75rem; font-weight:800; font-size:0.9rem;">CREATE ACCOUNT / SIGN IN</a>
                            <button id="skipWelcomePopup" class="btn btn-outline" style="padding:0.6rem; font-size:0.85rem;">Continue Browsing</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const closeModal = () => {
                sessionStorage.setItem('sa_welcome_dismissed', '1');
                document.getElementById('welcomePopupModal')?.remove();
            };

            document.getElementById('closeWelcomePopup')?.addEventListener('click', closeModal);
            document.getElementById('skipWelcomePopup')?.addEventListener('click', closeModal);
        }, 1500);
    }
}

window.addEventListener('storage', updateMobileBadges);
