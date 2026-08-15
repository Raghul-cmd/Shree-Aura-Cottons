// ==============================================================================
// VANAMALA WEAVES - SHOPPING CART MANAGEMENT MODULE
// ==============================================================================

const CART_STORAGE_KEY = 'vw_shopping_cart';

export function getCart() {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
}

export function saveCart(cartItems) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    updateCartBadge();
}

export function addToCart(product, quantity = 1) {
    let cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingIndex !== -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            compare_price: Number(product.compare_price || product.price),
            image: product.main_image,
            sku: product.sku,
            fabric: product.fabric,
            color: product.color,
            quantity: quantity
        });
    }
    
    saveCart(cart);
    showToast(`Added "${product.name}" to your shopping cart!`);
}

export function updateCartQuantity(productId, newQuantity) {
    let cart = getCart();
    if (newQuantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
    } else {
        const item = cart.find(i => i.id === productId);
        if (item) item.quantity = newQuantity;
    }
    saveCart(cart);
}

export function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    showToast('Item removed from cart.');
}

export function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartBadge();
}

export function getCartTotals(promoCode = '') {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Free shipping threshold ₹1,999
    const shipping = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
    
    let discount = 0;
    if (promoCode.trim().toUpperCase() === 'ROYAL10') {
        discount = Math.round(subtotal * 0.10); // 10% discount
    }
    
    const grandTotal = Math.max(0, subtotal + shipping - discount);
    
    return {
        subtotal,
        shipping,
        discount,
        grandTotal,
        itemCount: cart.reduce((count, item) => count + item.quantity, 0)
    };
}

export function updateCartBadge() {
    const totals = getCartTotals();
    const badge = document.getElementById('cartCountBadge');
    if (badge) {
        badge.textContent = totals.itemCount;
        badge.style.display = totals.itemCount > 0 ? 'flex' : 'none';
    }
}

export function showToast(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3200);
}

// Auto update badge on load
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});
