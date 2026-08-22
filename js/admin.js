// ==============================================================================
// WEAVES SAREE COLLECTIONS - ADMIN PORTAL JS CONTROLLER
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

// DOM Elements & State
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
    const user = await getCurrentUser();

    if (user && user.role === 'admin') {
        currentAdmin = user;
        showAdminDashboard();
        await loadDashboardData();
    } else {
        showLoginOverlay();
    }
}

function showLoginOverlay() {
    const overlay = document.getElementById('adminLoginOverlay');
    const app = document.getElementById('adminAppContainer');
    if (overlay) overlay.style.display = 'flex';
    if (app) app.style.display = 'none';
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
    if (emailEl) emailEl.textContent = currentAdmin?.email || 'admin@weavessareecollections.com';

    // Supabase Connection Status Badge
    const statusBadge = document.getElementById('supabaseStatusBadge');
    if (statusBadge) {
        if (supabaseClient) {
            statusBadge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981; margin-right:6px;"></span>Supabase Live DB Connected`;
            statusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
            statusBadge.style.color = '#10B981';
            statusBadge.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        } else {
            statusBadge.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#F59E0B; margin-right:6px;"></span>Local Mock Mode`;
            statusBadge.style.background = 'rgba(245, 158, 11, 0.15)';
            statusBadge.style.color = '#F59E0B';
            statusBadge.style.border = '1px solid rgba(245, 158, 11, 0.3)';
        }
    }
}

async function loadDashboardData() {
    showGlobalLoader(true);
    try {
        const [prods, cats, ords, custs] = await Promise.all([
            getProducts(true),
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
        populateCategoryDropdowns();
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
    const totalRev = allOrders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? Number(o.total_amount || 0) : 0), 0);
    const totalOrdersCount = allOrders.length;
    const activeProductsCount = allProducts.filter(p => p.is_active).length;
    const totalCustomersCount = allCustomers.length;

    document.getElementById('statTotalRevenue').textContent = '₹' + totalRev.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    document.getElementById('statTotalOrders').textContent = totalOrdersCount;
    document.getElementById('statActiveProducts').textContent = activeProductsCount;
    document.getElementById('statTotalCustomers').textContent = totalCustomersCount;

    // Render Recent Orders Table in Overview
    const recentOrders = [...allOrders].slice(0, 5);
    const recentTbody = document.getElementById('recentOrdersTbody');
    if (recentTbody) {
        if (recentOrders.length === 0) {
            recentTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:#94A3B8;">No recent orders found</td></tr>`;
        } else {
            recentTbody.innerHTML = recentOrders.map(o => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding:0.75rem; font-weight:700; color:#E2E8F0;">#${o.id.substring(0, 8)}</td>
                    <td style="padding:0.75rem; color:#CBD5E1;">${escapeHtml(o.customer_name || 'Customer')}</td>
                    <td style="padding:0.75rem; font-weight:700; color:#10B981;">₹${Number(o.total_amount || 0).toFixed(2)}</td>
                    <td style="padding:0.75rem;">${getStatusBadge(o.order_status)}</td>
                    <td style="padding:0.75rem; color:#94A3B8; font-size:0.8rem;">${new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
    }
}

// ------------------------------------------------------------------------------
// PRODUCTS MANAGEMENT
// ------------------------------------------------------------------------------
function renderProductsTable() {
    const tbody = document.getElementById('productsTableTbody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('productSearchInput')?.value || '').toLowerCase();
    const catFilter = document.getElementById('productCategoryFilter')?.value || '';

    const filtered = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || (p.sku && p.sku.toLowerCase().includes(searchTerm));
        const matchesCat = !catFilter || p.category_id === catFilter || p.category_name === catFilter;
        return matchesSearch && matchesCat;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:#94A3B8;">No products matching criteria</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const catName = p.categories?.name || p.category_name || 'Uncategorized';
        const imgUrl = p.main_image || 'assets/Saree Folder/1.jpeg';
        const isLowStock = p.stock <= 5;

        return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.06); transition:background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.03)'" onmouseleave="this.style.background='transparent'">
                <td style="padding:0.75rem;">
                    <img src="${imgUrl}" alt="${escapeHtml(p.name)}" style="width:48px; height:58px; object-fit:cover; border-radius:6px; border:1px solid rgba(255,255,255,0.15);" onError="this.src='assets/Saree Folder/1.jpeg'">
                </td>
                <td style="padding:0.75rem;">
                    <div style="font-weight:700; color:#F8FAFC; font-size:0.95rem;">${escapeHtml(p.name)}</div>
                    <div style="font-size:0.75rem; color:#94A3B8; font-family:monospace; margin-top:2px;">SKU: ${escapeHtml(p.sku || 'N/A')}</div>
                </td>
                <td style="padding:0.75rem;">
                    <span style="background:rgba(212,175,55,0.15); color:#D4AF37; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:600; border:1px solid rgba(212,175,55,0.3);">
                        ${escapeHtml(catName)}
                    </span>
                </td>
                <td style="padding:0.75rem;">
                    <div style="font-weight:800; color:#10B981;">₹${Number(p.price).toFixed(2)}</div>
                    ${p.compare_price ? `<div style="font-size:0.75rem; color:#64748B; text-decoration:line-through;">₹${Number(p.compare_price).toFixed(2)}</div>` : ''}
                </td>
                <td style="padding:0.75rem;">
                    <span style="padding:0.2rem 0.5rem; border-radius:4px; font-size:0.8rem; font-weight:700; ${isLowStock ? 'background:rgba(239,68,68,0.2); color:#EF4444;' : 'background:rgba(16,185,129,0.2); color:#10B981;'}">
                        ${p.stock} units
                    </span>
                </td>
                <td style="padding:0.75rem;">
                    <label class="switch" style="position:relative; display:inline-block; width:38px; height:22px;">
                        <input type="checkbox" ${p.is_active ? 'checked' : ''} onchange="window.handleToggleProductActive('${p.id}', this.checked)" style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:${p.is_active ? '#10B981' : '#475569'}; transition:.3s; border-radius:22px;">
                            <span style="position:absolute; content:''; height:16px; width:16px; left:${p.is_active ? '18px' : '3px'}; bottom:3px; background:white; transition:.3s; border-radius:50%;"></span>
                        </span>
                    </label>
                </td>
                <td style="padding:0.75rem;">
                    <div style="display:flex; gap:0.5rem;">
                        <button onclick="window.handleEditProduct('${p.id}')" style="background:#3B82F6; color:white; border:none; padding:0.4rem 0.7rem; border-radius:6px; font-weight:600; cursor:pointer; font-size:0.8rem;">Edit</button>
                        <button onclick="window.handleDeleteProduct('${p.id}', '${escapeHtml(p.name)}')" style="background:#EF4444; color:white; border:none; padding:0.4rem 0.7rem; border-radius:6px; font-weight:600; cursor:pointer; font-size:0.8rem;">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ------------------------------------------------------------------------------
// ORDERS MANAGEMENT
// ------------------------------------------------------------------------------
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableTbody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('orderSearchInput')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('orderStatusFilter')?.value || '';

    const filtered = allOrders.filter(o => {
        const matchesSearch = o.id.toLowerCase().includes(searchTerm) || 
                              (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm)) ||
                              (o.phone && o.phone.includes(searchTerm));
        const matchesStatus = !statusFilter || o.order_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:#94A3B8;">No orders found matching criteria</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const itemsSummary = (o.order_items || []).map(i => `${i.product_name} (x${i.quantity})`).join(', ') || 'Saree Order';

        return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="padding:0.85rem; font-weight:800; color:#E2E8F0; font-family:monospace;">#${o.id.substring(0, 8)}</td>
                <td style="padding:0.85rem;">
                    <div style="font-weight:700; color:#F8FAFC;">${escapeHtml(o.customer_name || 'Customer')}</div>
                    <div style="font-size:0.8rem; color:#94A3B8;">${escapeHtml(o.phone || '')} • ${escapeHtml(o.email || '')}</div>
                    <div style="font-size:0.75rem; color:#64748B; margin-top:2px;">${escapeHtml(o.address || '')}, ${escapeHtml(o.city || '')}</div>
                </td>
                <td style="padding:0.85rem; font-size:0.85rem; color:#CBD5E1; max-width:220px;">
                    ${escapeHtml(itemsSummary)}
                </td>
                <td style="padding:0.85rem; font-weight:800; color:#10B981; font-size:1.05rem;">
                    ₹${Number(o.total_amount || 0).toFixed(2)}
                </td>
                <td style="padding:0.85rem;">
                    <select onchange="window.handleUpdateOrderStatus('${o.id}', this.value, null)" style="background:#1E2638; color:#F8FAFC; border:1px solid #475569; padding:0.4rem 0.6rem; border-radius:6px; font-weight:600; font-size:0.85rem; cursor:pointer;">
                        <option value="placed" ${o.order_status === 'placed' ? 'selected' : ''}>Placed</option>
                        <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${o.order_status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td style="padding:0.85rem;">
                    <select onchange="window.handleUpdateOrderStatus('${o.id}', null, this.value)" style="background:#1E2638; color:#F8FAFC; border:1px solid #475569; padding:0.4rem 0.6rem; border-radius:6px; font-weight:600; font-size:0.85rem; cursor:pointer;">
                        <option value="pending" ${o.payment_status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${o.payment_status === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="failed" ${o.payment_status === 'failed' ? 'selected' : ''}>Failed</option>
                    </select>
                </td>
                <td style="padding:0.85rem; color:#94A3B8; font-size:0.8rem;">
                    ${new Date(o.created_at).toLocaleString()}
                </td>
            </tr>
        `;
    }).join('');
}

// ------------------------------------------------------------------------------
// CATEGORIES MANAGEMENT
// ------------------------------------------------------------------------------
function renderCategoriesGrid() {
    const grid = document.getElementById('categoriesGridContainer');
    if (!grid) return;

    if (allCategories.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:#94A3B8;">No categories available</div>`;
        return;
    }

    grid.innerHTML = allCategories.map(c => `
        <div style="background:#1E2638; border:1px solid rgba(255,255,255,0.08); border-radius:10px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 4px 12px rgba(0,0,0,0.3);">
            <div style="height:120px; overflow:hidden; position:relative; background:#0F172A;">
                <img src="${c.image_url || 'assets/Saree Folder/1.jpeg'}" alt="${escapeHtml(c.name)}" style="width:100%; height:100%; object-fit:cover;" onError="this.src='assets/Saree Folder/1.jpeg'">
                <div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); padding:2px 8px; border-radius:4px; color:#D4AF37; font-size:0.75rem; font-weight:700;">
                    ${c.slug}
                </div>
            </div>
            <div style="padding:1rem; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <h4 style="color:#F8FAFC; margin:0 0 0.4rem 0; font-size:1.1rem; font-weight:700;">${escapeHtml(c.name)}</h4>
                    <p style="color:#94A3B8; font-size:0.85rem; margin:0; line-height:1.4;">${escapeHtml(c.description || 'No description provided')}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// ------------------------------------------------------------------------------
// CUSTOMERS DIRECTORY
// ------------------------------------------------------------------------------
function renderCustomersTable() {
    const tbody = document.getElementById('customersTableTbody');
    if (!tbody) return;

    if (allCustomers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#94A3B8;">No customer profiles recorded</td></tr>`;
        return;
    }

    tbody.innerHTML = allCustomers.map(c => `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
            <td style="padding:0.85rem; font-weight:700; color:#F8FAFC;">${escapeHtml(c.name || 'Customer')}</td>
            <td style="padding:0.85rem; color:#CBD5E1;">${escapeHtml(c.email || 'N/A')}</td>
            <td style="padding:0.85rem; color:#CBD5E1;">${escapeHtml(c.phone || 'N/A')}</td>
            <td style="padding:0.85rem;">
                <span style="padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:700; ${c.role === 'admin' ? 'background:rgba(239,68,68,0.2); color:#EF4444;' : 'background:rgba(59,130,246,0.2); color:#3B82F6;'}">
                    ${(c.role || 'customer').toUpperCase()}
                </span>
            </td>
            <td style="padding:0.85rem; font-weight:700; color:#F8FAFC;">${c.total_orders || 0} orders</td>
            <td style="padding:0.85rem; font-weight:800; color:#10B981;">₹${Number(c.total_spent || 0).toFixed(2)}</td>
        </tr>
    `).join('');
}

function populateCategoryDropdowns() {
    const selectProductFilter = document.getElementById('productCategoryFilter');
    const selectFormCategory = document.getElementById('formProductCategory');

    const optionsHtml = allCategories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

    if (selectProductFilter) {
        selectProductFilter.innerHTML = `<option value="">All Categories</option>` + optionsHtml;
    }
    if (selectFormCategory) {
        selectFormCategory.innerHTML = `<option value="">Select Category...</option>` + optionsHtml;
    }
}

// ------------------------------------------------------------------------------
// EVENT HANDLERS & MODAL ACTIONS
// ------------------------------------------------------------------------------
function setupEventListeners() {
    // Admin Login Form
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

    // Navigation Tabs
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.dataset.tab;

            document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');

            item.classList.add('active');
            const targetEl = document.getElementById(`tab_${targetTab}`);
            if (targetEl) targetEl.style.display = 'block';
        });
    });

    // Search and Filters
    document.getElementById('productSearchInput')?.addEventListener('input', renderProductsTable);
    document.getElementById('productCategoryFilter')?.addEventListener('change', renderProductsTable);
    document.getElementById('orderSearchInput')?.addEventListener('input', renderOrdersTable);
    document.getElementById('orderStatusFilter')?.addEventListener('change', renderOrdersTable);

    // Save Product Form
    document.getElementById('productForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSaveProduct();
    });

    // Save Category Form
    document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSaveCategory();
    });

    // Image File Picker Upload to Supabase Storage
    document.getElementById('formProductImageFile')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadStatusEl = document.getElementById('imageUploadStatus');
        if (uploadStatusEl) uploadStatusEl.textContent = "⏳ Uploading image to Supabase Storage...";

        try {
            const publicUrl = await uploadImageToStorage(file);
            document.getElementById('formProductMainImage').value = publicUrl;
            if (uploadStatusEl) uploadStatusEl.textContent = "✅ Image uploaded to Supabase Storage!";
            showToast("Image uploaded successfully to Supabase Storage!", "success");
        } catch (err) {
            if (uploadStatusEl) uploadStatusEl.textContent = "⚠️ Upload error: " + err.message;
            showToast("Failed to upload image to Supabase Storage", "error");
        }
    });

    // Standalone Storage Uploader
    document.getElementById('standaloneImageFile')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const resultEl = document.getElementById('standaloneUploadResult');
        if (resultEl) resultEl.innerHTML = `<span style="color:#F59E0B;">⏳ Uploading to product-images bucket...</span>`;

        try {
            const publicUrl = await uploadImageToStorage(file);
            if (resultEl) {
                resultEl.innerHTML = `
                    <div style="background:#0F172A; padding:0.75rem; border-radius:6px; border:1px solid #10B981; margin-top:0.5rem;">
                        <div style="color:#10B981; font-weight:700; margin-bottom:4px;">✅ File Uploaded to Supabase Storage!</div>
                        <input type="text" value="${publicUrl}" readonly style="width:100%; background:#1E2638; color:#E2E8F0; border:1px solid #475569; padding:0.4rem; border-radius:4px; font-family:monospace; font-size:0.8rem;">
                    </div>
                `;
            }
            showToast("Image uploaded to Supabase Storage!", "success");
        } catch (err) {
            if (resultEl) resultEl.innerHTML = `<span style="color:#EF4444;">❌ Upload failed: ${err.message}</span>`;
        }
    });
}

// ------------------------------------------------------------------------------
// GLOBAL WINDOW HANDLERS FOR INLINE ACTIONS
// ------------------------------------------------------------------------------
window.openAddProductModal = () => {
    document.getElementById('productFormModalTitle').textContent = "Add New Saree Product";
    document.getElementById('productIdHidden').value = "";
    document.getElementById('productForm').reset();
    document.getElementById('imageUploadStatus').textContent = "";
    document.getElementById('productModalOverlay').style.display = 'flex';
};

window.closeProductModal = () => {
    document.getElementById('productModalOverlay').style.display = 'none';
};

window.openAddCategoryModal = () => {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryModalOverlay').style.display = 'flex';
};

window.closeCategoryModal = () => {
    document.getElementById('categoryModalOverlay').style.display = 'none';
};

window.handleEditProduct = async (id) => {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('productFormModalTitle').textContent = "Edit Saree Product";
    document.getElementById('productIdHidden').value = prod.id;
    document.getElementById('formProductName').value = prod.name;
    document.getElementById('formProductSKU').value = prod.sku || '';
    document.getElementById('formProductCategory').value = prod.category_id || '';
    document.getElementById('formProductPrice').value = prod.price;
    document.getElementById('formProductComparePrice').value = prod.compare_price || '';
    document.getElementById('formProductStock').value = prod.stock;
    document.getElementById('formProductFabric').value = prod.fabric || 'Cotton';
    document.getElementById('formProductColor').value = prod.color || '';
    document.getElementById('formProductOccasion').value = prod.occasion || 'Daily Wear';
    document.getElementById('formProductMainImage').value = prod.main_image || '';
    document.getElementById('formProductDescription').value = prod.description || '';
    document.getElementById('formProductIsActive').checked = prod.is_active !== false;
    document.getElementById('formProductIsFeatured').checked = !!prod.is_featured;

    document.getElementById('productModalOverlay').style.display = 'flex';
};

window.handleDeleteProduct = async (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}" from Supabase database?`)) {
        showGlobalLoader(true);
        try {
            await deleteProduct(id);
            showToast(`Product "${name}" deleted successfully.`, "success");
            await loadDashboardData();
        } catch (err) {
            showToast("Failed to delete product: " + err.message, "error");
        } finally {
            showGlobalLoader(false);
        }
    }
};

window.handleToggleProductActive = async (id, isActive) => {
    try {
        await toggleProductActive(id, isActive);
        const prod = allProducts.find(p => p.id === id);
        if (prod) prod.is_active = isActive;
        showToast(`Product status updated to ${isActive ? 'Active' : 'Inactive'}.`, "success");
    } catch (err) {
        showToast("Failed to toggle product status: " + err.message, "error");
    }
};

window.handleUpdateOrderStatus = async (orderId, orderStatus, paymentStatus) => {
    try {
        await updateOrderStatus(orderId, orderStatus, paymentStatus);
        showToast("Order updated in Supabase DB!", "success");
        await loadDashboardData();
    } catch (err) {
        showToast("Failed to update order: " + err.message, "error");
    }
};

async function handleSaveProduct() {
    const id = document.getElementById('productIdHidden').value;
    const name = document.getElementById('formProductName').value.trim();
    const sku = document.getElementById('formProductSKU').value.trim();
    const category_id = document.getElementById('formProductCategory').value;
    const price = parseFloat(document.getElementById('formProductPrice').value);
    const compare_price = parseFloat(document.getElementById('formProductComparePrice').value) || null;
    const stock = parseInt(document.getElementById('formProductStock').value);
    const fabric = document.getElementById('formProductFabric').value;
    const color = document.getElementById('formProductColor').value;
    const occasion = document.getElementById('formProductOccasion').value;
    const main_image = document.getElementById('formProductMainImage').value.trim() || 'assets/Saree Folder/1.jpeg';
    const description = document.getElementById('formProductDescription').value;
    const is_active = document.getElementById('formProductIsActive').checked;
    const is_featured = document.getElementById('formProductIsFeatured').checked;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const payload = {
        name,
        slug,
        sku,
        category_id: category_id || null,
        price,
        compare_price,
        stock,
        fabric,
        color,
        occasion,
        main_image,
        description,
        is_active,
        is_featured
    };

    showGlobalLoader(true);
    try {
        if (id) {
            await updateProduct(id, payload);
            showToast("Product updated in Supabase DB!", "success");
        } else {
            await saveProduct(payload);
            showToast("New Product saved to Supabase DB!", "success");
        }
        window.closeProductModal();
        await loadDashboardData();
    } catch (err) {
        showToast("Error saving product: " + err.message, "error");
    } finally {
        showGlobalLoader(false);
    }
}

async function handleSaveCategory() {
    const name = document.getElementById('formCatName').value.trim();
    const description = document.getElementById('formCatDescription').value.trim();
    const image_url = document.getElementById('formCatImage').value.trim() || 'assets/Saree Folder/1.jpeg';

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    showGlobalLoader(true);
    try {
        await saveCategory({ name, slug, description, image_url });
        showToast("Category created in Supabase DB!", "success");
        window.closeCategoryModal();
        await loadDashboardData();
    } catch (err) {
        showToast("Error creating category: " + err.message, "error");
    } finally {
        showGlobalLoader(false);
    }
}

// Helpers
function getStatusBadge(status) {
    const colors = {
        placed: { bg: 'rgba(59,130,246,0.2)', text: '#3B82F6' },
        processing: { bg: 'rgba(245,158,11,0.2)', text: '#F59E0B' },
        shipped: { bg: 'rgba(168,85,247,0.2)', text: '#A855F7' },
        delivered: { bg: 'rgba(16,185,129,0.2)', text: '#10B981' },
        cancelled: { bg: 'rgba(239,68,68,0.2)', text: '#EF4444' }
    };
    const c = colors[status] || colors.placed;
    return `<span style="background:${c.bg}; color:${c.text}; padding:0.25rem 0.6rem; border-radius:4px; font-size:0.75rem; font-weight:700; text-transform:capitalize;">${status}</span>`;
}

function showToast(message, type = 'info') {
    let toast = document.getElementById('adminToastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'adminToastNotification';
        toast.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:10000; padding:0.9rem 1.4rem; border-radius:8px; font-weight:600; font-size:0.9rem; box-shadow:0 8px 24px rgba(0,0,0,0.4); color:white; transition:all 0.3s;';
        document.body.appendChild(toast);
    }

    toast.style.background = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6';
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
    }, 4000);
}

function showGlobalLoader(show) {
    const loader = document.getElementById('adminGlobalLoader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
