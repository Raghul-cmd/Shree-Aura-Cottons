// ==============================================================================
// SHREE AURA COTTONS - EXECUTIVE ADMIN PORTAL CONTROLLER (SUPABASE DRIVEN)
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
    if (emailEl) emailEl.textContent = currentAdmin?.email || 'shreeauracottons@gmail.com';

    // Supabase Connection Status Badge
    const statusBadge = document.getElementById('supabaseStatusBadge');
    if (statusBadge) {
        if (supabaseClient) {
            statusBadge.innerHTML = `<span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#10B981; margin-right:8px; box-shadow:0 0 8px #10B981;"></span>Supabase DB Connected`;
            statusBadge.style.background = 'rgba(16, 185, 129, 0.12)';
            statusBadge.style.color = '#10B981';
            statusBadge.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        } else {
            statusBadge.innerHTML = `<span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#F59E0B; margin-right:8px; box-shadow:0 0 8px #F59E0B;"></span>Local Preview Mode`;
            statusBadge.style.background = 'rgba(245, 158, 11, 0.12)';
            statusBadge.style.color = '#F59E0B';
            statusBadge.style.border = '1px solid rgba(245, 158, 11, 0.3)';
        }
    }
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
    const totalRev = allOrders.reduce((sum, o) => sum + (o.payment_status === 'paid' ? Number(o.total_amount || 0) : 0), 0);
    const totalOrdersCount = allOrders.length;
    const activeProductsCount = allProducts.filter(p => p.is_active).length;
    const totalCustomersCount = allCustomers.length;

    const revEl = document.getElementById('statTotalRevenue');
    const ordEl = document.getElementById('statTotalOrders');
    const prodEl = document.getElementById('statActiveProducts');
    const custEl = document.getElementById('statTotalCustomers');

    if (revEl) revEl.textContent = '₹' + totalRev.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    if (ordEl) ordEl.textContent = totalOrdersCount;
    if (prodEl) prodEl.textContent = activeProductsCount;
    if (custEl) custEl.textContent = totalCustomersCount;

    // Render Recent Orders Table
    const recentOrders = [...allOrders].slice(0, 5);
    const recentTbody = document.getElementById('recentOrdersTbody');
    if (recentTbody) {
        if (recentOrders.length === 0) {
            recentTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.8rem; color:#475569; font-weight:700;">No recent orders recorded</td></tr>`;
        } else {
            recentTbody.innerHTML = recentOrders.map(o => `
                <tr>
                    <td style="font-weight:800; color:#7A1C30;">#${o.id}</td>
                    <td>${o.customer_name || 'Customer'}</td>
                    <td style="font-weight:800;">₹${Number(o.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td>
                        <span style="padding:0.25rem 0.6rem; border-radius:6px; font-size:0.75rem; font-weight:800; ${o.payment_status === 'paid' ? 'background:#D1FAE5; color:#065F46;' : 'background:#FEF3C7; color:#92400E;'}">
                            ${(o.payment_status || 'pending').toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <span style="padding:0.25rem 0.6rem; border-radius:6px; font-size:0.75rem; font-weight:800; background:#E0F2FE; color:#0369A1;">
                            ${(o.order_status || 'placed').toUpperCase()}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    }
}

// ------------------------------------------------------------------------------
// PRODUCTS TAB & CATALOG MANAGEMENT
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
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:3rem; color:#64748B; font-weight:700;">No sarees in catalog. Click <strong>"Add New Saree"</strong> to enter products directly into Supabase DB.</td></tr>`;
        return;
    }

    tbody.innerHTML = prods.map(p => {
        const imgUrl = p.main_image || (p.images && p.images[0]) || 'assets/logo.png';
        const categoryName = p.categories?.name || getCategoryNameById(p.category_id);

        return `
            <tr>
                <td>
                    <img src="${imgUrl}" alt="${p.name}" style="width:48px; height:60px; object-fit:cover; border-radius:6px; border:1px solid #CBD5E1;">
                </td>
                <td style="font-weight:800; color:#7A1C30;">${p.sku || p.id}</td>
                <td>
                    <div style="font-weight:800; color:#000000;">${p.name}</div>
                    ${p.is_featured ? '<span style="background:#FDE68A; color:#92400E; font-size:0.7rem; padding:0.1rem 0.4rem; border-radius:4px; font-weight:800;">Featured</span>' : ''}
                </td>
                <td><span style="background:#FAF8F5; border:1px solid #CBD5E1; padding:0.2rem 0.6rem; border-radius:6px; font-size:0.78rem; font-weight:800;">${categoryName}</span></td>
                <td style="font-weight:800; color:#000000;">₹${Number(p.price || 0).toLocaleString('en-IN')}</td>
                <td>${p.fabric || 'Cotton'}</td>
                <td>
                    <label style="display:inline-flex; align-items:center; cursor:pointer;">
                        <input type="checkbox" ${p.is_active ? 'checked' : ''} onchange="window.handleToggleProductActive('${p.id}', this.checked)" style="width:18px; height:18px;">
                        <span style="margin-left:0.4rem; font-size:0.78rem; font-weight:800; ${p.is_active ? 'color:#065F46;' : 'color:#991B1B;'}">${p.is_active ? 'Active' : 'Hidden'}</span>
                    </label>
                </td>
                <td>
                    <div style="display:flex; gap:0.4rem;">
                        <button onclick="window.handleEditProduct('${p.id}')" class="btn-admin-secondary" style="padding:0.35rem 0.7rem; font-size:0.78rem;">Edit</button>
                        <button onclick="window.handleDeleteProduct('${p.id}')" class="btn-danger-sm">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getCategoryNameById(catId) {
    if (!catId) return 'Uncategorized';
    const cat = allCategories.find(c => String(c.id) === String(catId));
    return cat ? cat.name : 'Category ' + catId;
}

// ------------------------------------------------------------------------------
// CATEGORIES TAB
// ------------------------------------------------------------------------------
function renderCategoriesGrid() {
    const grid = document.getElementById('categoriesGridContainer');
    if (!grid) return;

    if (allCategories.length === 0) {
        grid.innerHTML = `<div style="text-align:center; color:#64748B; padding:2rem;">No categories loaded</div>`;
        return;
    }

    grid.innerHTML = allCategories.map(c => {
        const prodCount = allProducts.filter(p => String(p.category_id) === String(c.id)).length;
        const img = c.image_url || 'assets/logo.png';

        return `
            <div style="background:#FFFFFF; border:1px solid #CBD5E1; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.04);">
                <img src="${img}" alt="${c.name}" style="width:100%; height:140px; object-fit:cover;">
                <div style="padding:1.2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                        <h4 style="font-family:var(--font-heading); color:#7A1C30; margin:0; font-size:1.1rem; font-weight:800;">${c.name}</h4>
                        <span style="background:#FDF7E7; border:1px solid #D4AF37; color:#7A1C30; font-size:0.75rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:12px;">${prodCount} Sarees</span>
                    </div>
                    <p style="color:#475569; font-size:0.82rem; margin:0; line-height:1.4; font-weight:600;">${c.description || 'Collection category'}</p>
                </div>
            </div>
        `;
    }).join('');
}

// ------------------------------------------------------------------------------
// ORDERS TAB
// ------------------------------------------------------------------------------
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableTbody');
    if (!tbody) return;

    if (allOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:3rem; color:#64748B; font-weight:700;">No customer orders placed yet</td></tr>`;
        return;
    }

    tbody.innerHTML = allOrders.map(o => `
        <tr>
            <td style="font-weight:800; color:#7A1C30;">#${o.id}</td>
            <td>
                <div style="font-weight:800; color:#000000;">${o.customer_name || 'Customer'}</div>
                <div style="font-size:0.78rem; color:#475569;">${o.email || ''}</div>
            </td>
            <td>
                <div>${o.phone || ''}</div>
                <div style="font-size:0.78rem; color:#475569;">${o.city || ''}, ${o.state || ''}</div>
            </td>
            <td style="font-weight:800;">₹${Number(o.total_amount || 0).toLocaleString('en-IN')}</td>
            <td><span style="background:#FAF8F5; border:1px solid #CBD5E1; padding:0.2rem 0.6rem; border-radius:6px; font-size:0.78rem; font-weight:800;">${(o.payment_method || 'cod').toUpperCase()}</span></td>
            <td>
                <select onchange="window.handleUpdateOrderStatus('${o.id}', this.value)" class="form-control" style="padding:0.3rem 0.5rem; font-size:0.8rem; font-weight:800;">
                    <option value="placed" ${o.order_status === 'placed' ? 'selected' : ''}>PLACED</option>
                    <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>PROCESSING</option>
                    <option value="shipped" ${o.order_status === 'shipped' ? 'selected' : ''}>SHIPPED</option>
                    <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>DELIVERED</option>
                    <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>CANCELLED</option>
                </select>
            </td>
            <td>
                <button onclick="window.handleViewOrderDetails('${o.id}')" class="btn-admin-secondary" style="padding:0.35rem 0.7rem; font-size:0.78rem;">View Items</button>
            </td>
        </tr>
    `).join('');
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
            <td style="font-weight:800; color:#7A1C30;">₹${Number(c.total_spent || 0).toLocaleString('en-IN')}</td>
            <td>
                <span style="padding:0.25rem 0.6rem; border-radius:6px; font-size:0.75rem; font-weight:800; ${c.role === 'admin' ? 'background:#FEE2E2; color:#991B1B;' : 'background:#DBEAFE; color:#1E40AF;'}">
                    ${(c.role || 'customer').toUpperCase()}
                </span>
            </td>
        </tr>
    `).join('');
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

    // Catalog Search Input
    document.getElementById('productSearchInput')?.addEventListener('input', (e) => {
        renderProductsTable(e.target.value);
    });

    // Product Modal Actions
    document.getElementById('openAddProductModalBtn')?.addEventListener('click', () => {
        openProductModal();
    });

    document.getElementById('closeProductModalBtn')?.addEventListener('click', () => {
        closeProductModal();
    });

    document.getElementById('cancelProductModalBtn')?.addEventListener('click', () => {
        closeProductModal();
    });

    // Save Product Form Handler
    document.getElementById('productForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('modalProductId').value;
        const sku = document.getElementById('modalProductSku').value.trim();
        const name = document.getElementById('modalProductName').value.trim();
        const categoryId = document.getElementById('modalProductCategory').value;
        const description = document.getElementById('modalProductDescription').value.trim();
        const price = Number(document.getElementById('modalProductPrice').value);
        const comparePrice = Number(document.getElementById('modalProductComparePrice').value) || null;
        const stock = Number(document.getElementById('modalProductStock').value) || 15;
        const fabric = document.getElementById('modalProductFabric').value;
        const color = document.getElementById('modalProductColor').value.trim() || 'Maroon';
        const occasion = document.getElementById('modalProductOccasion').value.trim() || 'Daily Wear';
        const isActive = document.getElementById('modalProductIsActive').checked;
        const isFeatured = document.getElementById('modalProductIsFeatured').checked;

        const fileInput = document.getElementById('modalProductImageFile');
        const urlInput = document.getElementById('modalProductMainImage').value.trim();

        showGlobalLoader(true);
        try {
            let mainImage = urlInput || 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/1.jpeg';

            // Handle Image File Upload to Supabase Storage Bucket
            if (fileInput && fileInput.files && fileInput.files[0]) {
                const uploadedUrl = await uploadImageToStorage(fileInput.files[0]);
                if (uploadedUrl) mainImage = uploadedUrl;
            }

            const productPayload = {
                sku: sku,
                name: name,
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                category_id: categoryId ? Number(categoryId) : 1,
                description: description,
                price: price,
                compare_price: comparePrice,
                discount_percentage: comparePrice && comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0,
                stock: stock,
                fabric: fabric,
                color: color,
                occasion: occasion,
                main_image: mainImage,
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
}

// Global Window Action Expositions
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

window.handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
        await updateOrderStatus(orderId, newStatus);
        showToast(`Order #${orderId} status updated to ${newStatus.toUpperCase()}`, "success");
        await loadDashboardData();
    } catch (err) {
        showToast("Update status failed: " + err.message, "error");
    }
};

window.handleViewOrderDetails = (orderId) => {
    const order = allOrders.find(o => String(o.id) === String(orderId));
    if (order) {
        const items = order.order_items || [];
        const detailsStr = items.map(i => `• ${i.product_name || 'Saree'} (x${i.quantity}) - ₹${Number(i.price || 0).toLocaleString('en-IN')}`).join('\n');
        alert(`ORDER #${order.id} DETAILS:\nCustomer: ${order.customer_name}\nAddress: ${order.address}, ${order.city}\nTotal: ₹${Number(order.total_amount || 0).toLocaleString('en-IN')}\n\nItems:\n${detailsStr || 'No items detail recorded'}`);
    }
};

function openProductModal(prod = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    if (!modal) return;

    if (prod) {
        if (title) title.textContent = "Edit Saree Details";
        document.getElementById('modalProductId').value = prod.id || '';
        document.getElementById('modalProductSku').value = prod.sku || prod.id || '';
        document.getElementById('modalProductCategory').value = prod.category_id || 1;
        document.getElementById('modalProductName').value = prod.name || '';
        document.getElementById('modalProductDescription').value = prod.description || '';
        document.getElementById('modalProductPrice').value = prod.price || '';
        document.getElementById('modalProductComparePrice').value = prod.compare_price || '';
        document.getElementById('modalProductStock').value = prod.stock || 15;
        document.getElementById('modalProductFabric').value = prod.fabric || 'Cotton';
        document.getElementById('modalProductColor').value = prod.color || '';
        document.getElementById('modalProductOccasion').value = prod.occasion || '';
        document.getElementById('modalProductMainImage').value = prod.main_image || '';
        document.getElementById('modalProductIsActive').checked = prod.is_active !== false;
        document.getElementById('modalProductIsFeatured').checked = !!prod.is_featured;
    } else {
        if (title) title.textContent = "Add New Saree";
        document.getElementById('modalProductId').value = '';
        document.getElementById('modalProductSku').value = 'SAR-COT-001';
        document.getElementById('modalProductCategory').value = '1';
        document.getElementById('modalProductName').value = '';
        document.getElementById('modalProductDescription').value = '';
        document.getElementById('modalProductPrice').value = '';
        document.getElementById('modalProductComparePrice').value = '';
        document.getElementById('modalProductStock').value = '15';
        document.getElementById('modalProductFabric').value = 'Cotton';
        document.getElementById('modalProductColor').value = 'Maroon';
        document.getElementById('modalProductOccasion').value = 'Daily Wear';
        document.getElementById('modalProductMainImage').value = '';
        document.getElementById('modalProductIsActive').checked = true;
        document.getElementById('modalProductIsFeatured').checked = false;
    }

    modal.style.display = 'flex';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
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
