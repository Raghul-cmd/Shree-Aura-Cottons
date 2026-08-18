// ==============================================================================
// VANAMALA WEAVES - SHOP COLLECTION PAGE CONTROLLER
// ==============================================================================

import { fetchAndFilterProducts, renderProductCardHTML } from './products.js';
import { addToCart } from './cart.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';
import { getProductById } from './supabase.js';

let currentFilters = {
    category: '',
    fabrics: [],
    colors: [],
    occasions: [],
    priceRange: '',
    search: '',
    sort: 'featured'
};

document.addEventListener('DOMContentLoaded', async () => {
    // Parse URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('category')) currentFilters.category = urlParams.get('category');
    if (urlParams.get('search')) currentFilters.search = urlParams.get('search');
    if (urlParams.get('sort')) currentFilters.sort = urlParams.get('sort');
    
    // Set UI elements initial states
    const searchInput = document.getElementById('shopSearchInput');
    if (searchInput && currentFilters.search) searchInput.value = currentFilters.search;

    const sortSelect = document.getElementById('shopSortSelect');
    if (sortSelect && currentFilters.sort) sortSelect.value = currentFilters.sort;

    if (currentFilters.category) {
        const catCb = document.querySelector(`input[name="categoryFilter"][value="${currentFilters.category}"]`);
        if (catCb) catCb.checked = true;
    }

    // Attach Event Listeners
    setupFilterListeners();
    setupMobileDrawer();
    
    // Initial Load
    await loadProductsGrid();
});

async function loadProductsGrid() {
    const gridEl = document.getElementById('shopProductGrid');
    const countEl = document.getElementById('shopProductCount');
    if (!gridEl) return;
    
    gridEl.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
            <p>Loading handloom sarees...</p>
        </div>
    `;

    try {
        const products = await fetchAndFilterProducts(currentFilters);
        renderActiveFilterPills();
        
        // Update Title & Breadcrumbs Dynamically
        const titleEl = document.querySelector('.shop-title-row h1');
        const breadcrumbEl = document.getElementById('currentCategoryBreadcrumb');
        let displayCat = 'All Saree Collections';

        if (currentFilters.category) {
            const formatted = currentFilters.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            displayCat = formatted.toLowerCase().includes('saree') ? formatted : `${formatted} Sarees`;
        } else if (currentFilters.fabrics && currentFilters.fabrics.length > 0) {
            displayCat = `${currentFilters.fabrics.join(', ')} Sarees`;
        } else if (currentFilters.occasions && currentFilters.occasions.length > 0) {
            displayCat = `${currentFilters.occasions.join(', ')} Collection`;
        } else if (currentFilters.colors && currentFilters.colors.length > 0) {
            displayCat = `${currentFilters.colors.join(', ')} Sarees`;
        } else if (currentFilters.search) {
            displayCat = `Search: "${currentFilters.search}"`;
        }

        if (titleEl) titleEl.textContent = displayCat;
        if (breadcrumbEl) breadcrumbEl.textContent = displayCat;

        if (countEl) countEl.textContent = `Showing ${products.length} Saree${products.length === 1 ? '' : 's'}`;
        
        if (products.length === 0) {
            gridEl.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; background: var(--bg-white); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--primary-maroon); margin-bottom: 0.5rem;">No Sarees Match Your Filters</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Try clearing some filters or searching for another fabric or color.</p>
                    <button id="resetFiltersBtn" class="btn btn-outline">Clear All Filters</button>
                </div>
            `;
            document.getElementById('resetFiltersBtn')?.addEventListener('click', clearAllFilters);
            return;
        }

        gridEl.innerHTML = products.map(renderProductCardHTML).join('');
        
        // Attach Card Interaction Handlers
        attachCardListeners(products);
        
    } catch (err) {
        console.error("Error loading shop grid:", err);
        gridEl.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Failed to load products. Please try again.</p>`;
    }
}

function attachCardListeners(products) {
    // Add to Cart buttons
    document.querySelectorAll('.card-add-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const product = products.find(p => p.id === id);
            if (product) addToCart(product, 1);
        });
    });
    
    // Wishlist buttons
    document.querySelectorAll('.wishlist-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.currentTarget;
            const id = btnEl.dataset.id;
            const product = products.find(p => p.id === id);
            if (product) {
                const added = toggleWishlist(product);
                if (added) {
                    btnEl.classList.add('active');
                } else {
                    btnEl.classList.remove('active');
                }
            }
        });
    });
}

function setupFilterListeners() {
    // Category Checkboxes
    document.querySelectorAll('input[name="categoryFilter"]').forEach(cb => {
        cb.addEventListener('change', () => {
            const checked = Array.from(document.querySelectorAll('input[name="categoryFilter"]:checked')).map(el => el.value);
            currentFilters.category = checked.length > 0 ? checked[0] : '';
            loadProductsGrid();
        });
    });

    // Fabric Checkboxes
    document.querySelectorAll('input[name="fabricFilter"]').forEach(cb => {
        cb.addEventListener('change', () => {
            currentFilters.fabrics = Array.from(document.querySelectorAll('input[name="fabricFilter"]:checked')).map(el => el.value);
            loadProductsGrid();
        });
    });

    // Color Checkboxes
    document.querySelectorAll('input[name="colorFilter"]').forEach(cb => {
        cb.addEventListener('change', () => {
            currentFilters.colors = Array.from(document.querySelectorAll('input[name="colorFilter"]:checked')).map(el => el.value);
            loadProductsGrid();
        });
    });

    // Occasion Checkboxes
    document.querySelectorAll('input[name="occasionFilter"]').forEach(cb => {
        cb.addEventListener('change', () => {
            currentFilters.occasions = Array.from(document.querySelectorAll('input[name="occasionFilter"]:checked')).map(el => el.value);
            loadProductsGrid();
        });
    });

    // Price Range Radio/Checkbox
    document.querySelectorAll('input[name="priceFilter"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            currentFilters.priceRange = e.target.checked ? e.target.value : '';
            loadProductsGrid();
        });
    });

    // Sort Dropdown
    document.getElementById('shopSortSelect')?.addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        loadProductsGrid();
    });

    // Special Offers % Button Toggle
    let onlyOffers = false;
    document.getElementById('offerFilterBtn')?.addEventListener('click', (e) => {
        onlyOffers = !onlyOffers;
        const btn = e.currentTarget;
        btn.classList.toggle('active', onlyOffers);
        btn.innerHTML = onlyOffers ? '🏷️ Offers Active %' : '🏷️ Special Offers %';
        currentFilters.onlyOffers = onlyOffers;
        loadProductsGrid();
    });
}

function clearAllFilters() {
    currentFilters = {
        category: '',
        fabrics: [],
        colors: [],
        occasions: [],
        priceRange: '',
        search: '',
        sort: 'featured'
    };
    
    document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.filter-sidebar input[type="radio"]').forEach(rb => rb.checked = false);
    
    loadProductsGrid();
}

function renderActiveFilterPills() {
    const container = document.getElementById('activeFilterPills');
    if (!container) return;
    
    let pillsHTML = '';
    
    if (currentFilters.category) {
        pillsHTML += `<span class="filter-pill">Category: ${currentFilters.category} <button onclick="removeFilter('category')">×</button></span>`;
    }
    currentFilters.fabrics.forEach(f => {
        pillsHTML += `<span class="filter-pill">Fabric: ${f} <button onclick="removeFilter('fabric', '${f}')">×</button></span>`;
    });
    currentFilters.colors.forEach(c => {
        pillsHTML += `<span class="filter-pill">Color: ${c} <button onclick="removeFilter('color', '${c}')">×</button></span>`;
    });
    currentFilters.occasions.forEach(o => {
        pillsHTML += `<span class="filter-pill">Occasion: ${o} <button onclick="removeFilter('occasion', '${o}')">×</button></span>`;
    });
    if (currentFilters.priceRange) {
        pillsHTML += `<span class="filter-pill">Price: ₹${currentFilters.priceRange.replace('-', ' - ₹')} <button onclick="removeFilter('priceRange')">×</button></span>`;
    }
    
    container.innerHTML = pillsHTML;
}

window.removeFilter = function(type, val) {
    if (type === 'category') {
        currentFilters.category = '';
        document.querySelectorAll('input[name="categoryFilter"]').forEach(el => el.checked = false);
    }
    if (type === 'priceRange') currentFilters.priceRange = '';
    if (type === 'fabric') currentFilters.fabrics = currentFilters.fabrics.filter(x => x !== val);
    if (type === 'color') currentFilters.colors = currentFilters.colors.filter(x => x !== val);
    if (type === 'occasion') currentFilters.occasions = currentFilters.occasions.filter(x => x !== val);
    
    // Uncheck corresponding UI inputs
    if (type === 'fabric') {
        const el = document.querySelector(`input[name="fabricFilter"][value="${val}"]`);
        if (el) el.checked = false;
    }
    if (type === 'color') {
        const el = document.querySelector(`input[name="colorFilter"][value="${val}"]`);
        if (el) el.checked = false;
    }
    if (type === 'occasion') {
        const el = document.querySelector(`input[name="occasionFilter"][value="${val}"]`);
        if (el) el.checked = false;
    }
    
    loadProductsGrid();
};

function setupMobileDrawer() {
    const filterBtn = document.getElementById('mobileFilterBtn');
    const closeBtn = document.getElementById('closeFilterBtn');
    const sidebar = document.getElementById('filterSidebar');
    
    filterBtn?.addEventListener('click', () => sidebar?.classList.add('active'));
    closeBtn?.addEventListener('click', () => sidebar?.classList.remove('active'));
}
