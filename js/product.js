// ==============================================================================
// VANAMALA WEAVES - PRODUCT DETAILS PAGE CONTROLLER
// ==============================================================================

import { getProductById, getProducts } from './supabase.js';
import { addToCart } from './cart.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';
import { renderProductCardHTML } from './products.js';

let currentProduct = null;
let currentQuantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || urlParams.get('slug');
    
    if (!productId) {
        window.location.href = 'shop.html';
        return;
    }
    
    try {
        currentProduct = await getProductById(productId);
        if (!currentProduct) {
            document.getElementById('productContainer').innerHTML = `<h2 style="text-align:center; padding: 4rem;">Saree Not Found</h2>`;
            return;
        }

        renderProductDetails(currentProduct);
        await loadRelatedProducts(currentProduct);

    } catch (err) {
        console.error("Error displaying product details:", err);
    }
});

function renderProductDetails(product) {
    // Title & Breadcrumb
    document.title = `${product.name} - Shree Aura Cottons`;
    document.getElementById('breadcrumbCategory').textContent = product.fabric || product.category_name || 'Collection';
    document.getElementById('breadcrumbTitle').textContent = product.name;

    // Product Header Info
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productSKU').textContent = `SKU: ${product.sku || 'SAR-001'}`;
    
    // Stock Pill
    const stockEl = document.getElementById('productStock');
    if (product.stock > 0) {
        stockEl.textContent = `In Stock (${product.stock} available)`;
        stockEl.className = 'stock-status-pill in-stock';
    } else {
        stockEl.textContent = 'Out of Stock';
        stockEl.className = 'stock-status-pill out-stock';
    }

    // Pricing
    document.getElementById('salePrice').textContent = `₹${Number(product.price).toLocaleString('en-IN')}`;
    if (product.compare_price) {
        document.getElementById('oldPrice').textContent = `₹${Number(product.compare_price).toLocaleString('en-IN')}`;
        const discount = product.discount_percentage || Math.round(((product.compare_price - product.price) / product.compare_price) * 100);
        document.getElementById('discountBadge').textContent = `Save ${discount}%`;
    } else {
        document.getElementById('oldPrice').style.display = 'none';
        document.getElementById('discountBadge').style.display = 'none';
    }

    // Description & Specifications
    document.getElementById('productDescription').textContent = product.description;
    document.getElementById('specFabric').textContent = product.fabric || 'Pure Handloom';
    document.getElementById('specColor').textContent = product.color || 'Vibrant Crimson';
    document.getElementById('specOccasion').textContent = product.occasion || 'Daily & Festive Wear';
    document.getElementById('specBlouse').textContent = 'Unstitched 80cm blouse piece included';
    document.getElementById('specLength').textContent = '6.3 Meters (including blouse)';
    document.getElementById('specCare').textContent = 'Dry Clean Only for lasting zari shimmer';

    // Gallery Setup
    const allImages = product.images && product.images.length > 0 ? product.images : [product.main_image];
    const mainImgEl = document.getElementById('mainProductImg');
    if (mainImgEl) {
        mainImgEl.src = allImages[0] || 'assets/Saree Folder/1.jpeg';
        mainImgEl.onerror = function() { this.onerror = null; this.src = 'assets/Saree Folder/1.jpeg'; };
    }
    
    const thumbContainer = document.getElementById('thumbnailList');
    if (thumbContainer) {
        thumbContainer.innerHTML = allImages.map((img, idx) => `
            <div class="thumb-item ${idx === 0 ? 'active' : ''}" data-src="${img}">
                <img src="${img}" alt="${product.name}" onError="this.onerror=null; this.src='assets/Saree Folder/1.jpeg';">
            </div>
        `).join('');

        thumbContainer.querySelectorAll('.thumb-item').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                thumbContainer.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
                const item = e.currentTarget;
                item.classList.add('active');
                mainImgEl.src = item.dataset.src;
            });
        });
    }

    // Quantity Selector Logic
    const qtyInput = document.getElementById('qtyInput');
    document.getElementById('qtyMinus')?.addEventListener('click', () => {
        if (currentQuantity > 1) {
            currentQuantity--;
            qtyInput.value = currentQuantity;
        }
    });
    
    document.getElementById('qtyPlus')?.addEventListener('click', () => {
        if (currentQuantity < (product.stock || 99)) {
            currentQuantity++;
            qtyInput.value = currentQuantity;
        }
    });

    // Action Buttons
    const addToCartBtn = document.getElementById('addToCartBtn');
    addToCartBtn?.addEventListener('click', () => {
        addToCart(product, currentQuantity);
    });

    const buyNowBtn = document.getElementById('buyNowBtn');
    buyNowBtn?.addEventListener('click', () => {
        addToCart(product, currentQuantity);
        window.location.href = '/checkout.html';
    });

    // Wishlist Button
    const wishlistBtn = document.getElementById('productWishlistBtn');
    if (wishlistBtn) {
        if (isInWishlist(product.id)) wishlistBtn.classList.add('active');
        wishlistBtn.addEventListener('click', () => {
            const added = toggleWishlist(product);
            wishlistBtn.classList.toggle('active', added);
        });
    }
}

async function loadRelatedProducts(product) {
    const container = document.getElementById('relatedProductsGrid');
    if (!container) return;
    
    const allProds = await getProducts();
    const related = allProds
        .filter(p => p.id !== product.id && (p.fabric === product.fabric || p.category_id === product.category_id))
        .slice(0, 4);

    if (related.length > 0) {
        container.innerHTML = related.map(renderProductCardHTML).join('');
    } else {
        container.innerHTML = `<p style="color:var(--text-muted);">No related sarees found.</p>`;
    }
}
