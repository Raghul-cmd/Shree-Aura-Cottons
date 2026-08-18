// ==============================================================================
// VANAMALA WEAVES - PRODUCT RENDERER & FILTERING ENGINE
// ==============================================================================

import { getProducts } from './supabase.js';
import { isInWishlist } from './wishlist.js';

export async function fetchAndFilterProducts(filters = {}) {
    let products = await getProducts(false);
    
    // Category Filter
    if (filters.category) {
        const catTarget = filters.category.toLowerCase().trim();
        const cleanCat = catTarget.replace('-sarees', '').replace('sarees', '').trim();

        products = products.filter(p => {
            if (p.categories) {
                if (p.categories.slug === filters.category || p.categories.id === filters.category) return true;
                if (p.categories.name && p.categories.name.toLowerCase() === catTarget) return true;
            }
            if (p.category_id && (p.category_id === filters.category || p.category_id.toLowerCase() === catTarget)) return true;
            if (p.category_name) {
                const nameSlug = p.category_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                if (p.category_name.toLowerCase() === catTarget || nameSlug === catTarget || p.category_name.toLowerCase().includes(cleanCat)) return true;
            }
            if (p.fabric) {
                const fabricSlug = p.fabric.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                if (p.fabric.toLowerCase() === catTarget || fabricSlug === catTarget || p.fabric.toLowerCase().includes(cleanCat) || cleanCat.includes(p.fabric.toLowerCase())) return true;
            }
            return false;
        });
    }
    
    // Fabrics Multi-select Filter
    if (filters.fabrics && filters.fabrics.length > 0) {
        products = products.filter(p => p.fabric && filters.fabrics.includes(p.fabric));
    }
    
    // Colors Multi-select Filter
    if (filters.colors && filters.colors.length > 0) {
        products = products.filter(p => p.color && filters.colors.includes(p.color));
    }
    
    // Occasions Multi-select Filter
    if (filters.occasions && filters.occasions.length > 0) {
        products = products.filter(p => p.occasion && filters.occasions.includes(p.occasion));
    }
    
    // Price Range Filter
    if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-').map(Number);
        products = products.filter(p => {
            const price = Number(p.price);
            if (max) return price >= min && price <= max;
            return price >= min;
        });
    }
    
    // Only Offers Filter
    if (filters.onlyOffers) {
        products = products.filter(p => (p.compare_price && p.compare_price > p.price) || (p.discount_percentage && p.discount_percentage > 0));
    }

    // Search Query Filter
    if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        products = products.filter(p => 
            p.name.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.fabric && p.fabric.toLowerCase().includes(q)) ||
            (p.color && p.color.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q))
        );
    }

    // Sorting Engine
    if (filters.sort) {
        switch (filters.sort) {
            case 'price-asc':
                products.sort((a, b) => Number(a.price) - Number(b.price));
                break;
            case 'price-desc':
                products.sort((a, b) => Number(b.price) - Number(a.price));
                break;
            case 'title-asc':
                products.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'title-desc':
                products.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'newest':
                products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'featured':
            default:
                products.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
                break;
        }
    }
    
    return products;
}

export function renderProductCardHTML(product) {
    const isSaved = isInWishlist(product.id);
    const discount = product.discount_percentage || 
        (product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0);
        
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image-wrap">
                ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
                <button class="wishlist-toggle-btn ${isSaved ? 'active' : ''}" data-id="${product.id}" title="Add to Wishlist">
                    <svg viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
                <a href="/product.html?id=${product.id}">
                    <img src="${product.main_image}" alt="${product.name}" loading="lazy" onError="this.src='https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'">
                </a>
            </div>
            <div class="product-info">
                <span class="product-category-tag">${product.fabric || 'Pure Handloom'} • ${product.occasion || 'Daily Wear'}</span>
                <h3 class="product-title">
                    <a href="/product.html?id=${product.id}">${product.name}</a>
                </h3>
                <div class="price-row">
                    <span class="sale-price">₹${Number(product.price).toLocaleString('en-IN')}</span>
                    ${product.compare_price ? `<span class="old-price">₹${Number(product.compare_price).toLocaleString('en-IN')}</span>` : ''}
                </div>
                <button class="card-add-cart-btn" data-id="${product.id}">
                    ADD TO CART
                </button>
            </div>
        </div>
    `;
}
