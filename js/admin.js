// ==============================================================================
// SHREE AURA COTTONS - EXECUTIVE ADMIN PORTAL CONTROLLER (LIVE SUPABASE SYNC)
// ==============================================================================

import { 
    getProducts, 
    getProductById, 
    saveProduct, 
    updateProduct, 
    deleteProduct, 
    toggleProductActive, 
    getCategories, 
    saveCategory, 
    getOrders, 
    updateOrderStatus, 
    getCustomers, 
    uploadImageToStorage,
    supabaseClient 
} from './supabase.js';

import { loginAdmin, getCurrentUser, logoutUser } from './auth.js';

// Application State
let currentAdmin = null;
let allProducts = [];
let allCategories = [];
let allOrders = [];
let allCustomers = [];

document.addEventListener('DOMContentLoaded', async () => {
    await initAdminPortal();
});

async function initAdminPortal() {
    setupEventListeners();
    await checkAdminAuth();
}

async function checkAdminAuth() {
    try {
        const user = await getCurrentUser();

        if (user && user.role === 'admin') {
            currentAdmin = user;
            showAdminDashboard();
            await loadDashboardData();
        } else {
            showLoginOverlay();
        }
    } catch (err) {
        showLoginOverlay();
    } finally {
        showGlobalLoader(false);
    }
}

function showLoginOverlay() {
    const overlay = document.getElementById('adminLoginOverlay');
    const app = document.getElementById('adminAppContainer');
    if (overlay) overlay.style.display = 'flex';
    if (app) app.style.display = 'none';
    showGlobalLoader(false);
}

function showAdminDashboard() {
    const overlay = document.getElementById('adminLoginOverlay');
    const app = document.getElementById('adminAppContainer');
    if (overlay) overlay.style.display = 'none';
    if (app) app.style.display = 'flex';

    // Set Admin Profile Info
    const nameEl = document.getElementById('adminProfileName');
    const emailEl = document.getElementById('adminProfileEmail');
    if (nameEl) nameEl.textContent = currentAdmin?.full_name || 'Store Administrator';
    if (emailEl) emailEl.textContent = currentAdmin?.email || 'shreeauracottons@gmail.com';
}

async function loadDashboardData() {
    showGlobalLoader(true);
    try {
        const [prods, cats, ords, custs] = await Promise.all([
            getProducts({ active: undefined }),
            getCategories(),
            getOrders(),
            getCustomers()
        ]);

        allProducts = prods || [];
        allCategories = cats || [];
        allOrders = ords || [];
        allCustomers = custs || [];

        renderOverviewStats();
        renderProductsTable();
        renderOrdersTable();
        renderCategoriesGrid();
        renderCustomersTable();
    } catch (err) {
        console.error("Error loading admin dashboard data:", err);
        showToast("Error loading Supabase data: " + err.message, "error");
    } finally {
        showGlobalLoader(false);
    }
}

// ------------------------------------------------------------------------------
// OVERVIEW TAB STATS
// ------------------------------------------------------------------------------
function renderOverviewStats() {
    const userWishlist = JSON.parse(localStorage.getItem('vw_user_wishlist') || '[]');
    const totalWishlistCount = userWishlist.length > 0 ? userWishlist.length : (allProducts.length > 0 ? Math.min(allProducts.length, 3) : 0);
    const activeProductsCount = allProducts.filter(p => p.is_active).length;
    const totalCustomersCount = allCustomers.length;

    const revEl = document.getElementById('statTotalRevenue');
    const ordEl = document.getElementById('statTotalOrders');
    const prodEl = document.getElementById('statActiveProducts');
    const custEl = document.getElementById('statTotalCustomers');

    if (revEl) revEl.textContent = '₹0.00';
    if (ordEl) ordEl.textContent = totalWishlistCount;
    if (prodEl) prodEl.textContent = activeProductsCount;
    if (custEl) custEl.textContent = totalCustomersCount;

    // Render Saved Customer Wishlists Table
    let displayWishlist = userWishlist;
    if (displayWishlist.length === 0 && allProducts.length > 0) {
        displayWishlist = allProducts.slice(0, 5).map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku || `SAR-00${p.id}`,
            price: p.price,
            main_image: p.main_image || p.image_url
        }));
    }

    const recentOrders = displayWishlist.slice(0, 5);
    const recentTbody = document.getElementById('recentOrdersTbody');
    if (recentTbody) {
        if (recentOrders.length === 0) {
            recentTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.8rem; color:#64748B; font-weight:700;">No saved wishlists recorded</td></tr>`;
        } else {
            recentTbody.innerHTML = recentOrders.map(w => {
                const img = w.main_image || 'assets/logo.png';
                return `
                    <tr>
                        <td>
                            <img src="${img}" alt="${w.name}" style="width:40px; height:50px; object-fit:cover; border-radius:4px; border:1px solid #CBD5E1;">
                        </td>
                        <td style="font-weight:800; color:#000000;">${w.name}</td>
                        <td style="font-weight:700; color:#475569;">${w.sku || 'SAR-001'}</td>
                        <td style="font-weight:800; color:#7A1C30;">₹${Number(w.price || 0).toLocaleString('en-IN')}</td>
                        <td>
                            <span class="pill-badge" style="background:#ECFDF5; color:#047857; border-color:#A7F3D0;">
                                SAVED ♡
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

// ------------------------------------------------------------------------------
// SAREE CATALOG TAB (WITH EXACT TOGGLE SWITCH SLIDER FROM PHOTO)
// ------------------------------------------------------------------------------
function renderProductsTable(filterQuery = '') {
    const tbody = document.getElementById('productsTableTbody');
    if (!tbody) return;

    let prods = [...allProducts];
    if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase();
        prods = prods.filter(p => 
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.color && p.color.toLowerCase().includes(q)) ||
            (p.fabric && p.fabric.toLowerCase().includes(q))
        );
    }

    if (prods.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:3rem; color:#64748B; font-weight:700;">No sarees in catalog. Click <strong>"Add New Saree"</strong> to enter products into Supabase DB.</td></tr>`;
        return;
    }

    tbody.innerHTML = prods.map(p => {
        const imgUrl = p.main_image || (p.images && p.images[0]) || 'assets/logo.png';
        const categoryName = p.categories?.name || getCategoryNameById(p.category_id);
        const comparePriceHtml = p.compare_price ? `<div style="font-size:0.75rem; color:#94A3B8; text-decoration:line-through;">₹${Number(p.compare_price).toFixed(2)}</div>` : '';

        return `
            <tr>
                <td>
                    <img src="${imgUrl}" alt="${p.name}" style="width:48px; height:58px; object-fit:cover; border-radius:6px; border:1px solid #CBD5E1;">
                </td>
                <td>
                    <div style="font-weight:800; color:#000000; font-size:0.92rem;">${p.name}</div>
                    <div style="font-size:0.75rem; color:#64748B; font-weight:700;">SKU: ${p.sku || p.id}</div>
                </td>
                <td>
                    <span class="pill-badge">${categoryName}</span>
                </td>
                <td>
                    <div style="font-weight:800; color:#000000;">₹${Number(p.price || 0).toFixed(2)}</div>
                    ${comparePriceHtml}
                </td>
                <td>
                    <span class="pill-badge pill-badge-stock">${p.stock || 10} units</span>
                </td>
                <td>
                    <label class="switch-toggle" title="${p.is_active !== false ? 'Active' : 'Hidden'}">
                        <input type="checkbox" ${p.is_active !== false ? 'checked' : ''} onchange="window.handleToggleProductActive('${p.id}', this.checked)">
                        <span class="slider-round"></span>
                    </label>
                </td>
                <td>
                    <div style="display:flex; gap:0.4rem;">
                        <button onclick="window.handleEditProduct('${p.id}')" class="btn-action-edit">Edit</button>
                        <button onclick="window.handleDeleteProduct('${p.id}')" class="btn-action-delete">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
function getCategoryName(catId) {
    if (!catId) return 'Office Wear';
    const cat = allCategories.find(c => String(c.id) === String(catId));
    return cat ? cat.name : (catId === 1 ? 'Wedding Sarees' : (catId === 2 ? 'Office Wear' : 'Daily Wear'));
}

// ------------------------------------------------------------------------------
// ORDERS & SHIPMENTS TAB
// ------------------------------------------------------------------------------
function renderOrdersTable(query = '', statusFilter = '') {
    const tbody = document.getElementById('ordersTableTbody');
    if (!tbody) return;

    let ords = [...allOrders];
    if (query.trim()) {
        const q = query.toLowerCase();
        ords = ords.filter(o => 
            String(o.id).includes(q) || 
            (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
            (o.phone && o.phone.includes(q))
        );
    }
    if (statusFilter) {
        ords = ords.filter(o => (o.order_status || 'placed').toLowerCase() === statusFilter.toLowerCase());
    }

    if (ords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:3rem; color:#64748B; font-weight:700;">No orders matching search filter</td></tr>`;
        return;
    }

    tbody.innerHTML = ords.map(o => {
        const items = o.order_items || [];
        const itemsListHtml = items.length > 0
            ? items.map(i => `<div style="font-size:0.85rem; color:#1E293B; font-weight:700;">${i.product_name || 'Saree'} <span style="color:#7A1C30;">(x${i.quantity || 1})</span></div>`).join('')
            : `<div style="font-size:0.85rem; color:#1E293B; font-weight:700;">Saree Collection (x1)</div>`;

        const dtStr = o.created_at ? new Date(o.created_at).toLocaleString('en-GB') : 'Today';

        return `
            <tr>
                <td style="font-weight:800; color:#7A1C30;">#${o.id}</td>
                <td>
                    <div style="font-weight:800; color:#000000;">${o.customer_name || 'Customer'}</div>
                    <div style="font-size:0.75rem; color:#64748B;">${o.phone || ''} • ${o.email || ''}</div>
                    <div style="font-size:0.75rem; color:#64748B;">${o.address || ''}, ${o.city || ''}</div>
                </td>
                <td>${itemsListHtml}</td>
                <td style="font-weight:800; color:#000000;">₹${Number(o.total_amount || 0).toFixed(2)}</td>
                <td>
                    <select onchange="window.handleUpdateOrderStatus('${o.id}', this.value)" class="form-control" style="padding:0.3rem 0.5rem; font-size:0.8rem; font-weight:800;">
                        <option value="placed" ${(o.order_status || 'placed') === 'placed' ? 'selected' : ''}>Placed</option>
                        <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${o.order_status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <select onchange="window.handleUpdatePaymentStatus('${o.id}', this.value)" class="form-control" style="padding:0.3rem 0.5rem; font-size:0.8rem; font-weight:800; background:#FFFBEB; color:#92400E;">
                        <option value="pending" ${(o.payment_status || 'pending') === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${o.payment_status === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="failed" ${o.payment_status === 'failed' ? 'selected' : ''}>Failed</option>
                    </select>
                </td>
                <td style="font-size:0.78rem; color:#64748B;">${dtStr}</td>
            </tr>
        `;
    }).join('');
}

// ------------------------------------------------------------------------------
// CATEGORIES TAB (WITH EDIT & ADD CATEGORY)
// ------------------------------------------------------------------------------
function renderCategoriesGrid() {
    const grid = document.getElementById('categoriesGridContainer');
    if (!grid) return;

    if (allCategories.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:#64748B; font-weight:700;">No categories available. Click <strong>"Add New Category"</strong> above to create one.</div>`;
        return;
    }

    grid.innerHTML = allCategories.map(c => {
        const prodCount = allProducts.filter(p => String(p.category_id) === String(c.id)).length;
        const img = c.image_url || 'assets/logo.png';

        return `
            <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.04); display:flex; flex-direction:column;">
                <img src="${img}" alt="${c.name}" style="width:100%; height:160px; object-fit:cover;">
                <div style="padding:1.2rem; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                            <h4 style="font-family:var(--font-heading); color:#7A1C30; margin:0; font-size:1.15rem; font-weight:800;">${c.name}</h4>
                            <span class="pill-badge" style="background:#FDF7E7; border-color:#D4AF37; color:#7A1C30;">${prodCount} Sarees</span>
                        </div>
                        <p style="color:#475569; font-size:0.84rem; margin:0 0 1rem 0; line-height:1.4;">${c.description || 'Collection category'}</p>
                    </div>

                    <button onclick="window.handleEditCategory('${c.id}')" class="btn-maroon" style="width:100%; justify-content:center; padding:0.5rem;">
                        <span>📷</span> Edit & Upload Category Image
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ------------------------------------------------------------------------------
// CUSTOMERS TAB
// ------------------------------------------------------------------------------
function renderCustomersTable() {
    const tbody = document.getElementById('customersTableTbody');
    if (!tbody) return;

    if (allCustomers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:3rem; color:#64748B; font-weight:700;">No customer profiles recorded</td></tr>`;
        return;
    }

    tbody.innerHTML = allCustomers.map(c => `
        <tr>
            <td style="font-weight:800; color:#000000;">${c.name || 'Customer'}</td>
            <td>${c.email || 'N/A'}</td>
            <td>${c.phone || 'N/A'}</td>
            <td style="font-weight:800;">${c.total_orders || 0}</td>
            <td style="font-weight:800; color:#7A1C30;">₹${Number(c.total_spent || 0).toFixed(2)}</td>
            <td>
                <span class="pill-badge" style="${c.role === 'admin' ? 'background:#FEE2E2; color:#991B1B;' : 'background:#DBEAFE; color:#1E40AF;'}">
                    ${(c.role || 'customer').toUpperCase()}
                </span>
            </td>
        </tr>
    `).join('');
}

// ------------------------------------------------------------------------------
// EVENT HANDLERS & NAVIGATION
// ------------------------------------------------------------------------------
function setupEventListeners() {
    // Admin Sign-In Form
    document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminLoginEmail').value;
        const password = document.getElementById('adminLoginPassword').value;
        const btn = e.target.querySelector('button[type="submit"]');

        try {
            btn.disabled = true;
            btn.textContent = "Authenticating with Supabase...";
            const res = await loginAdmin(email, password);
            currentAdmin = res.user;
            showToast("Welcome back, Administrator!", "success");
            showAdminDashboard();
            await loadDashboardData();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "SIGN IN TO ADMIN PORTAL";
        }
    });

    // Admin Logout
    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
        logoutUser();
    });

    // Mobile Navigation Drawer Toggle & Backdrop Overlay
    const mobileNavToggle = document.getElementById('adminMobileNavToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminNavOverlay');

    const toggleMobileSidebar = (show) => {
        if (adminSidebar && adminOverlay) {
            if (show === undefined) show = !adminSidebar.classList.contains('active');
            adminSidebar.classList.toggle('active', show);
            adminOverlay.classList.toggle('active', show);
        }
    };

    mobileNavToggle?.addEventListener('click', () => toggleMobileSidebar());
    adminOverlay?.addEventListener('click', () => toggleMobileSidebar(false));

    // Left Vertical Sidebar Nav Tab Switching
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.dataset.tab;

            document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');

            item.classList.add('active');
            const targetEl = document.getElementById(`tab_${targetTab}`);
            if (targetEl) targetEl.style.display = 'block';

            // Auto-close mobile sidebar drawer on selection
            toggleMobileSidebar(false);
        });
    });

    // Catalog Search Filter
    document.getElementById('productSearchInput')?.addEventListener('input', (e) => {
        renderProductsTable(e.target.value);
    });

    // Orders Search & Filter
    document.getElementById('orderSearchInput')?.addEventListener('input', (e) => {
        const query = e.target.value;
        const status = document.getElementById('orderStatusFilter')?.value || '';
        renderOrdersTable(query, status);
    });

    document.getElementById('orderStatusFilter')?.addEventListener('change', (e) => {
        const status = e.target.value;
        const query = document.getElementById('orderSearchInput')?.value || '';
        renderOrdersTable(query, status);
    });

    // Product Modal Event Listeners
    document.getElementById('openAddProductModalBtn')?.addEventListener('click', () => {
        openProductModal();
    });

    document.getElementById('closeProductModalBtn')?.addEventListener('click', () => {
        closeProductModal();
    });

    document.getElementById('cancelProductModalBtn')?.addEventListener('click', () => {
        closeProductModal();
    });

    // Category Modal Event Listeners
    document.getElementById('openAddCategoryModalBtn')?.addEventListener('click', () => {
        openCategoryModal();
    });

    document.getElementById('closeCategoryModalBtn')?.addEventListener('click', () => {
        closeCategoryModal();
    });

    document.getElementById('cancelCategoryModalBtn')?.addEventListener('click', () => {
        closeCategoryModal();
    });

    // Image File Input Listener for Product Modal
    document.getElementById('modalProductImageFile')?.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            showGlobalLoader(true);
            try {
                const uploadedUrl = await uploadImageToStorage(e.target.files[0]);
                if (uploadedUrl) {
                    document.getElementById('modalProductMainImage').value = uploadedUrl;
                    
                    const previewContainer = document.getElementById('productImagePreviewContainer');
                    const previewImg = document.getElementById('productImagePreviewImg');
                    if (previewContainer && previewImg) {
                        previewImg.src = uploadedUrl;
                        previewContainer.style.display = 'block';
                    }

                    showToast("Image uploaded to Supabase Storage bucket!", "success");
                }
            } catch (err) {
                showToast("Image upload failed: " + err.message, "error");
            } finally {
                showGlobalLoader(false);
            }
        }
    });

    // Category Image File Upload Listener
    document.getElementById('modalCategoryImageFile')?.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            showGlobalLoader(true);
            try {
                const uploadedUrl = await uploadImageToStorage(e.target.files[0]);
                if (uploadedUrl) {
                    document.getElementById('modalCategoryImage').value = uploadedUrl;
                    showToast("Category image uploaded to Supabase Storage bucket!", "success");
                }
            } catch (err) {
                showToast("Category image upload failed: " + err.message, "error");
            } finally {
                showGlobalLoader(false);
            }
        }
    });

    // Media CDN File Name Display
    document.getElementById('mediaCdnFileInput')?.addEventListener('change', (e) => {
        const nameSpan = document.getElementById('mediaCdnFileName');
        if (nameSpan) {
            nameSpan.textContent = e.target.files && e.target.files[0] ? e.target.files[0].name : 'No file chosen';
        }
    });

    // Media CDN Tab Upload Button
    document.getElementById('uploadMediaCdnBtn')?.addEventListener('click', async () => {
        const fileInput = document.getElementById('mediaCdnFileInput');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            showGlobalLoader(true);
            try {
                const url = await uploadImageToStorage(fileInput.files[0]);
                if (url) {
                    const resultDiv = document.getElementById('uploadedCdnUrlResult');
                    const outputInput = document.getElementById('cdnUrlOutputText');
                    if (resultDiv) resultDiv.style.display = 'block';
                    if (outputInput) outputInput.value = url;
                    showToast("Uploaded to Supabase CDN!", "success");
                }
            } catch (err) {
                showToast("Upload failed: " + err.message, "error");
            } finally {
                showGlobalLoader(false);
            }
        }
    });

    // Product Form Submit Handler (Fabric is Always Hardcoded to Pure Cotton)
    document.getElementById('productForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('modalProductId').value;
        const name = document.getElementById('modalProductName').value.trim();
        const sku = document.getElementById('modalProductSku').value.trim();
        const categoryId = document.getElementById('modalProductCategory').value;
        const price = Number(document.getElementById('modalProductPrice').value);
        const comparePrice = Number(document.getElementById('modalProductComparePrice').value) || null;
        const stock = Number(document.getElementById('modalProductStock').value) || 10;
        const fabric = "Pure Cotton"; // ALWAYS PURE COTTON
        const color = document.getElementById('modalProductColor').value.trim() || 'Brown';
        const occasion = document.getElementById('modalProductOccasion').value.trim() || 'Office Wear';
        const mainImage = document.getElementById('modalProductMainImage').value.trim() || 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/1.jpeg';
        const description = document.getElementById('modalProductDescription').value.trim();
        const isActive = document.getElementById('modalProductIsActive').checked;
        const isFeatured = document.getElementById('modalProductIsFeatured').checked;

        showGlobalLoader(true);
        try {
            const productPayload = {
                sku: sku,
                name: name,
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                category_id: categoryId ? Number(categoryId) : 2,
                price: price,
                compare_price: comparePrice,
                discount_percentage: comparePrice && comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0,
                stock: stock,
                fabric: fabric,
                color: color,
                occasion: occasion,
                main_image: mainImage,
                description: description,
                is_active: isActive,
                is_featured: isFeatured
            };

            if (id) {
                await updateProduct(id, productPayload);
                showToast("Saree updated in Supabase DB successfully!", "success");
            } else {
                productPayload.id = sku || ('SAR-' + Date.now());
                await saveProduct(productPayload);
                showToast("New Saree inserted into Supabase DB successfully!", "success");
            }

            closeProductModal();
            await loadDashboardData();
        } catch (err) {
            console.error("Save product error:", err);
            showToast("Failed to save saree: " + err.message, "error");
        } finally {
            showGlobalLoader(false);
        }
    });

    // Category Form Submit Handler
    document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('modalCategoryId').value;
        const name = document.getElementById('modalCategoryName').value.trim();
        const description = document.getElementById('modalCategoryDescription').value.trim();
        const imageUrl = document.getElementById('modalCategoryImage').value.trim() || 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/1.jpeg';

        showGlobalLoader(true);
        try {
            const categoryPayload = {
                id: id ? Number(id) : undefined,
                name: name,
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                description: description,
                image_url: imageUrl
            };

            await saveCategory(categoryPayload);
            showToast(id ? "Category updated in Supabase DB!" : "New Category created in Supabase DB!", "success");
            closeCategoryModal();
            await loadDashboardData();
        } catch (err) {
            console.error("Save category error:", err);
            showToast("Failed to save category: " + err.message, "error");
        } finally {
            showGlobalLoader(false);
        }
    });
}

// Global Window Function Bindings
window.switchToOrdersTab = () => {
    const ordersItem = document.querySelector('.sidebar-item[data-tab="orders"]');
    if (ordersItem) ordersItem.click();
};

window.handleToggleProductActive = async (id, isActive) => {
    try {
        await toggleProductActive(id, isActive);
        showToast(`Product ${isActive ? 'activated' : 'hidden'}`, "success");
        await loadDashboardData();
    } catch (err) {
        showToast(err.message, "error");
    }
};

window.handleEditProduct = (id) => {
    const prod = allProducts.find(p => String(p.id) === String(id));
    if (prod) openProductModal(prod);
};

window.handleDeleteProduct = async (id) => {
    if (confirm("Are you sure you want to delete this saree from Supabase?")) {
        showGlobalLoader(true);
        try {
            await deleteProduct(id);
            showToast("Saree deleted from Supabase", "success");
            await loadDashboardData();
        } catch (err) {
            showToast("Delete failed: " + err.message, "error");
        } finally {
            showGlobalLoader(false);
        }
    }
};

window.handleEditCategory = (id) => {
    const cat = allCategories.find(c => String(c.id) === String(id));
    if (cat) openCategoryModal(cat);
};

window.handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
        await updateOrderStatus(orderId, newStatus, null);
        showToast(`Order #${orderId} status updated to ${newStatus.toUpperCase()}`, "success");
        await loadDashboardData();
    } catch (err) {
        showToast("Update status failed: " + err.message, "error");
    }
};

window.handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
        await updateOrderStatus(orderId, null, newPaymentStatus);
        showToast(`Order #${orderId} payment status updated to ${newPaymentStatus.toUpperCase()}`, "success");
        await loadDashboardData();
    } catch (err) {
        showToast("Update payment status failed: " + err.message, "error");
    }
};

function openProductModal(prod = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    if (!modal) return;

    const previewContainer = document.getElementById('productImagePreviewContainer');
    const previewImg = document.getElementById('productImagePreviewImg');

    if (prod) {
        if (title) title.textContent = "Edit Saree Product";
        document.getElementById('modalProductId').value = prod.id || '';
        document.getElementById('modalProductName').value = prod.name || '';
        document.getElementById('modalProductSku').value = prod.sku || prod.id || '';
        document.getElementById('modalProductCategory').value = prod.category_id || 2;
        document.getElementById('modalProductPrice').value = prod.price || '';
        document.getElementById('modalProductComparePrice').value = prod.compare_price || '';
        document.getElementById('modalProductStock').value = prod.stock || 10;
        document.getElementById('modalProductFabric').value = "Pure Cotton";
        document.getElementById('modalProductColor').value = prod.color || 'Brown';
        document.getElementById('modalProductOccasion').value = prod.occasion || 'Office Wear';
        document.getElementById('modalProductMainImage').value = prod.main_image || '';
        document.getElementById('modalProductDescription').value = prod.description || '';
        document.getElementById('modalProductIsActive').checked = prod.is_active !== false;
        document.getElementById('modalProductIsFeatured').checked = !!prod.is_featured;

        if (prod.main_image && previewContainer && previewImg) {
            previewImg.src = prod.main_image;
            previewContainer.style.display = 'block';
        } else if (previewContainer) {
            previewContainer.style.display = 'none';
        }
    } else {
        if (title) title.textContent = "Add New Saree Product";
        document.getElementById('modalProductId').value = '';
        document.getElementById('modalProductName').value = 'Brown Border Kattam';
        document.getElementById('modalProductSku').value = 'SAR-OFF-006';
        document.getElementById('modalProductCategory').value = '2';
        document.getElementById('modalProductPrice').value = '999';
        document.getElementById('modalProductComparePrice').value = '1499';
        document.getElementById('modalProductStock').value = '10';
        document.getElementById('modalProductFabric').value = 'Pure Cotton';
        document.getElementById('modalProductColor').value = 'Brown';
        document.getElementById('modalProductOccasion').value = 'Office Wear';
        document.getElementById('modalProductMainImage').value = '';
        document.getElementById('modalProductDescription').value = 'This sophisticated pure cotton saree features a subtle pinstriped body in a warm...';
        document.getElementById('modalProductIsActive').checked = true;
        document.getElementById('modalProductIsFeatured').checked = false;

        if (previewContainer) previewContainer.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
}

function openCategoryModal(cat = null) {
    const modal = document.getElementById('categoryEditModal');
    const title = document.getElementById('categoryModalTitle');
    if (!modal) return;

    if (cat) {
        if (title) title.textContent = "Edit Category Showcase";
        document.getElementById('modalCategoryId').value = cat.id || '';
        document.getElementById('modalCategoryName').value = cat.name || '';
        document.getElementById('modalCategoryDescription').value = cat.description || '';
        document.getElementById('modalCategoryImage').value = cat.image_url || '';
    } else {
        if (title) title.textContent = "Add New Category";
        document.getElementById('modalCategoryId').value = '';
        document.getElementById('modalCategoryName').value = '';
        document.getElementById('modalCategoryDescription').value = '';
        document.getElementById('modalCategoryImage').value = '';
    }

    modal.style.display = 'flex';
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryEditModal');
    if (modal) modal.style.display = 'none';
}

function showToast(message, type = "success") {
    const toast = document.getElementById('adminToastNotification');
    if (!toast) return;
    toast.textContent = message;
    toast.style.borderLeftColor = type === "success" ? "#10B981" : "#EF4444";
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3500);
}

function showGlobalLoader(show) {
    const loader = document.getElementById('adminGlobalLoader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}
