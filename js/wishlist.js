// ==============================================================================
// SHREE AURA COTTONS - WISHLIST MANAGEMENT MODULE
// ==============================================================================

import { showToast } from './cart.js';

const WISHLIST_KEY = 'vw_user_wishlist';

export function getWishlist() {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
}

export function isInWishlist(productId) {
    const list = getWishlist();
    return list.some(item => item.id === productId);
}

export function toggleWishlist(product) {
    let list = getWishlist();
    const index = list.findIndex(item => item.id === product.id);
    let added = false;
    
    if (index !== -1) {
        list.splice(index, 1);
        showToast(`Removed "${product.name}" from wishlist.`);
    } else {
        list.push({
            id: product.id,
            name: product.name,
            price: product.price,
            compare_price: product.compare_price,
            main_image: product.main_image || product.image_url,
            sku: product.sku
        });
        added = true;
        showToast(`Saved "${product.name}" to your wishlist! ♡`);
    }
    
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    updateWishlistBadge();
    return added;
}

export function updateWishlistBadge() {
    const list = getWishlist();
    const badge = document.getElementById('wishlistCountBadge');
    if (badge) {
        badge.textContent = list.length;
        badge.style.display = list.length > 0 ? 'flex' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateWishlistBadge();
});
