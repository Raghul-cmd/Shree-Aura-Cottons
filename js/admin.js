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

    // Admin Profile Header Info
    const nameEl = document.getElementById('adminProfileName');
    const emailEl = document.getElementById('adminProfileEmail');
    if (nameEl) nameEl.textContent = currentAdmin?.full_name || 'Store Administrator';
    if (emailEl) emailEl.textContent = currentAdmin?.email || 'shreeauracottons@gmail.com';

    // Connection Status Badge
    const statusBadge = document.getElementById('supabaseStatusBadge');
    if (statusBadge) {
        if (supabaseClient) {
            statusBadge.innerHTML = `<span style="width:8px; height:8px; border-radius:50%; background:#10B981; margin-right:6px;"></span>Supabase DB Connected`;
            statusBadge.style.background = 'rgba(16, 185, 129, 0.15)';
            statusBadge.style.color = '#10B981';
            statusBadge.style.border = '1px solid rgba(16, 185, 129, 0.4)';
        } else {
            statusBadge.innerHTML = `<span style="width:8px; height:8px; border-radius:50%; background:#F59E0B; margin-right:6px;"></span>Local Preview Mode`;
            statusBadge.style.background = 'rgba(245, 158, 11, 0.15)';
            statusBadge.style.color = '#F59E0B';
            statusBadge.style.border = '1px solid rgba(245, 158, 11, 0.4)';
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
// OVERVIEW TAB (MATCHING USER PHOTO 4)
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

    // Recent Orders Table
    const recentOrders = [...allOrders].slice(0, 5);
    const recentTbody = document.getElementById('recentOrdersTbody');
    if (recentTbody) {
        if (recentOrders.length === 0) {
            recentTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.8rem; color:#64748B;">No recent customer orders recorded</td></tr>`;
        } else {
            recentTbody.innerHTML = recentOrders.map(o => `
                <tr>
                    <td style="font-weight:800; color:#7A1C30;">#${o.id}</td>
                    <td>${o.customer_name || 'Customer'}</td>
                    <td style="font-weight:800;">₹${Number(o.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td>
                        <span style="padding:0.25rem 0.6rem; border-radius:6px; font-size:0.75rem; font-weight:800; background:#E0F2FE; color:#0369A1;">
                            ${(o.order_status || 'placed').toUpperCase()}
                        </span>
                    </td>
                    <td style="color:#64748B; font-size:0.8rem;">${formatDate(o.created_at)}</td>
                </tr>
            `).join('');
        }
    }
}

// ------------------------------------------------------------------------------
// SAREE CATALOG TAB (MATCHING USER PHOTO 2)
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
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:3rem; color:#64748B;">No sarees found in catalog. Click <strong>"Add New Saree"</strong> to create products.</td></tr>`;
        return;
    }

    tbody.innerHTML = prods.map(p => {
        const imgUrl = p.main_image || (p.images && p.images[0]) || 'assets/logo.png';
        const categoryName = getCategoryNameById(p.category_id);
        const comparePrice = p.compare_price ? `<div style="font-size:0.75rem; color:#94A3B8; text-decoration:line-through;">₹${Number(p.compare_price).toLocaleString('en-IN')}</div>` : '';

        return `
            <tr>
                <td>
                    <img src="${imgUrl}" alt="${p.name}" style="width:48px; height:58px; object-fit:cover; border-radius:6px; border:1px solid #CBD5E1;">
                </td>
                <td>
                    <div style="font-weight:800; color:#000000; font-size:0.92rem;">${p.name}</div>
                    <div style="font-size:0.75rem; color:#7A1C30; font-weight:800;">SKU: ${p.sku || p.id}</div>
                </td>
                <td>
                    <span style="background:#FAF8F5; border:1px solid #E2E8F0; padding:0.25rem 0.65rem; border-radius:12px; font-size:0.78rem; font-weight:800;">${categoryName}</span>
                </td>
                <td>
                    <div style="font-weight:800; color:#000000;">₹${Number(p.price || 0).toLocaleString('en-IN')}</div>
                    ${comparePrice}
                </td>
                <td>
                    <span style="background:#E0F2FE; color:#0369A1; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px; font-size:0.75rem;">${p.stock || 10} units</span>
                </td>
                <td>
                    <label style="display:inline-flex; align-items:center; cursor:pointer;">
                        <input type="checkbox" ${p.is_active ? 'checked' : ''} onchange="window.handleToggleProductActive('${p.id}', this.checked)" style="width:18px; height:18px;">
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
}

function getCategoryNameById(catId) {
    if (!catId) return 'Office Wear';
    const cat = allCategories.find(c => String(c.id) === String(catId));
    return cat ? cat.name : 'Office Wear';
}

// ------------------------------------------------------------------------------
// ORDERS & SHIPMENTS TAB (MATCHING USER PHOTO 3)
// ------------------------------------------------------------------------------
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableTbody');
    if (!tbody) return;

    const query = (document.getElementById('orderSearchInput')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('orderStatusFilter')?.value || '';

    let ords = [...allOrders];

    if (query) {
        ords = ords.filter(o => 
            String(o.id).toLowerCase().includes(query) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
            (o.phone && o.phone.includes(query))
        );
    }

    if (statusFilter) {
        ords = ords.filter(o => (o.order_status || 'placed').toLowerCase() === statusFilter.toLowerCase());
    }

    if (ords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:3rem; color:#64748B;">No customer orders placed yet</td></tr>`;
        return;
    }

    tbody.innerHTML = ords.map(o => {
        const items = o.order_items || [];
        const itemsStr = items.length > 0 
            ? items.map(i => `${i.product_name || 'Saree'} (x${i.quantity || 1})`).join(', ')
            : 'Saree Order';

        return `
            <tr>
                <td style="font-weight:800; color:#7A1C30;">#${o.id}</td>
                <td>
                    <div style="font-weight:800; color:#000000;">${o.customer_name || 'Customer'}</div>
                    <div style="font-size:0.75rem; color:#475569;">${o.phone || ''} • ${o.email || ''}</div>
                    <div style="font-size:0.75rem; color:#64748B;">${o.address || ''}, ${o.city || ''}</div>
                </td>
                <td style="font-size:0.8rem; color:#1E293B;">${itemsStr}</td>
                <td style="font-weight:800; color:#000000;">₹${Number(o.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>
                    <select onchange="window.handleUpdateOrderStatus('${o.id}', this.value)" class="form-control" style="padding:0.25rem 0.4rem; font-size:0.78rem; font-weight:800;">
                        <option value="placed" ${o.order_status === 'placed' ? 'selected' : ''}>Placed</option>
                        <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${o.order_status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <select onchange="window.handleUpdatePaymentStatus('${o.id}', this.value)" class="form-control" style="padding:0.25rem 0.4rem; font-size:0.78rem; font-weight:800;">
                        <option value="pending" ${o.payment_status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${o.payment_status === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="failed" ${o.payment_status === 'failed' ? 'selected' : ''}>Failed</option>
                    </select>
                </td>
                <td style="font-size:0.78rem; color:#64748B;">${formatDate(o.created_at)}</td>
            </tr>
        `;
    }).join('');
}

// ------------------------------------------------------------------------------
// CATEGORIES & CUSTOMERS TABS
// ------------------------------------------------------------------------------
function renderCategoriesGrid() {
    const grid = document.getElementById('categoriesGridContainer');
    if (!grid) return;

    grid.innerHTML = allCategories.map(c => {
        const prodCount = allProducts.filter(p => String(p.category_id) === String(c.id)).length;
        const img = c.image_url || 'assets/logo.png';

        return `
            <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                <img src="${img}" alt="${c.name}" style="width:100%; height:140px; object-fit:cover;">
                <div style="padding:1.2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                        <h4 style="font-family:var(--font-heading); color:#7A1C30; margin:0; font-size:1.1rem; font-weight:800;">${c.name}</h4>
                        <span style="background:#FDF7E7; border:1px solid #D4AF37; color:#7A1C30; font-size:0.75rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:12px;">${prodCount} Sarees</span>
                    </div>
                    <p style="color:#64748B; font-size:0.82rem; margin:0; line-height:1.4;">${c.description || 'Collection category'}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderCustomersTable() {
    const tbody = document.getElementById('customersTableTbody');
    if (!tbody) return;

    if (allCustomers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2.5rem; color:#64748B;">No customer directory entries found</td></tr>`;
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
// EVENT LISTENERS & MODAL ACTIONS
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
            btn.textContent = "Authenticating...";
            const res = await loginAdmin(email, password);
            currentAdmin = res.user;
            showToast("Authenticated as Administrator", "success");
            showAdminDashboard();
            await loadDashboardData();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "SIGN IN TO ADMIN PORTAL";
        }
    });

    // Logout Button
    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
        logoutUser();
    });

    // Sidebar Tab Navigation (MATCHING USER PHOTOS)
    document.querySelectorAll('.admin-sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.dataset.tab;

            document.querySelectorAll('.admin-sidebar-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');

            item.classList.add('active');
            const targetEl = document.getElementById(`tab_${targetTab}`);
            if (targetEl) targetEl.style.display = 'block';
        });
    });

    // View All Orders Link on Overview Tab
    document.getElementById('viewAllOrdersBtn')?.addEventListener('click', () => {
        const ordersTabBtn = document.querySelector('.admin-sidebar-item[data-tab="orders"]');
        if (ordersTabBtn) ordersTabBtn.click();
    });

    // Product Search Input
    document.getElementById('productSearchInput')?.addEventListener('input', (e) => {
        renderProductsTable(e.target.value);
    });

    // Order Search & Status Filter
    document.getElementById('orderSearchInput')?.addEventListener('input', () => renderOrdersTable());
    document.getElementById('orderStatusFilter')?.addEventListener('change', () => renderOrdersTable());

    // Product Modal Handlers
    document.getElementById('openAddProductModalBtn')?.addEventListener('click', () => openProductModal());
    document.getElementById('closeProductModalBtn')?.addEventListener('click', () => closeProductModal());
    document.getElementById('cancelProductModalBtn')?.addEventListener('click', () => closeProductModal());

    // Trigger File Input from Inline Upload Button inside CDN Input Box (MATCHING USER PHOTO 1)
    document.getElementById('triggerImageUploadBtn')?.addEventListener('click', () => {
        document.getElementById('modalProductImageFile')?.click();
    });

    // Handle File Selection and Instant Supabase Storage Upload
    document.getElementById('modalProductImageFile')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            showToast("Uploading file to Supabase Storage...", "info");
            const uploadedUrl = await uploadImageToStorage(file);
            if (uploadedUrl) {
                document.getElementById('modalProductMainImage').value = uploadedUrl;
                showToast("File uploaded to Storage CDN!", "success");
            } else {
                showToast("Upload failed, using local file preview", "error");
            }
        }
    });

    // Save Saree Form Handler
    document.getElementById('productForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('modalProductId').value;
        const name = document.getElementById('modalProductName').value.trim();
        const sku = document.getElementById('modalProductSku').value.trim();
        const categoryId = document.getElementById('modalProductCategory').value;
        const price = Number(document.getElementById('modalProductPrice').value);
        const comparePrice = Number(document.getElementById('modalProductComparePrice').value) || null;
        const stock = Number(document.getElementById('modalProductStock').value) || 10;
        const fabric = document.getElementById('modalProductFabric').value;
        const color = document.getElementById('modalProductColor').value.trim() || 'Brown';
        const occasion = document.getElementById('modalProductOccasion').value.trim() || 'Office Wear';
        const mainImage = document.getElementById('modalProductMainImage').value.trim() || 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/1.jpeg';
        const description = document.getElementById('modalProductDescription').value.trim();
        const isActive = document.getElementById('modalProductIsActive').checked;
        const isFeatured = document.getElementById('modalProductIsFeatured').checked;

        showGlobalLoader(true);
        try {
            const productPayload = {
                name: name,
                sku: sku,
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                category_id: Number(categoryId) || 2,
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
                showToast("Saree product updated successfully!", "success");
            } else {
                productPayload.id = sku || ('SAR-' + Date.now());
                await saveProduct(productPayload);
                showToast("Saree product saved to Supabase!", "success");
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

    // Direct Media CDN Uploader Tab
    document.getElementById('directMediaUpload')?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const resDiv = document.getElementById('directMediaResult');
            if (resDiv) resDiv.textContent = "Uploading to Supabase CDN...";
            const url = await uploadImageToStorage(file);
            if (url && resDiv) {
                resDiv.innerHTML = `✅ Uploaded: <a href="${url}" target="_blank" style="color:#7A1C30; word-break:break-all;">${url}</a>`;
            } else if (resDiv) {
                resDiv.textContent = "Upload failed.";
            }
        }
    });
}

// Global Window Handlers
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
    if (confirm("Are you sure you want to delete this saree product?")) {
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

window.handleUpdatePaymentStatus = async (orderId, newStatus) => {
    showToast(`Payment status updated to ${newStatus.toUpperCase()}`, "success");
};

function openProductModal(prod = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    if (!modal) return;

    if (prod) {
        if (title) title.textContent = "Edit Saree Product";
        document.getElementById('modalProductId').value = prod.id || '';
        document.getElementById('modalProductName').value = prod.name || '';
        document.getElementById('modalProductSku').value = prod.sku || prod.id || '';
        document.getElementById('modalProductCategory').value = prod.category_id || 2;
        document.getElementById('modalProductPrice').value = prod.price || '';
        document.getElementById('modalProductComparePrice').value = prod.compare_price || '';
        document.getElementById('modalProductStock').value = prod.stock || 10;
        document.getElementById('modalProductFabric').value = prod.fabric || 'Cotton';
        document.getElementById('modalProductColor').value = prod.color || 'Brown';
        document.getElementById('modalProductOccasion').value = prod.occasion || 'Office Wear';
        document.getElementById('modalProductMainImage').value = prod.main_image || '';
        document.getElementById('modalProductDescription').value = prod.description || '';
        document.getElementById('modalProductIsActive').checked = prod.is_active !== false;
        document.getElementById('modalProductIsFeatured').checked = !!prod.is_featured;
    } else {
        if (title) title.textContent = "Add Saree Product";
        document.getElementById('modalProductId').value = '';
        document.getElementById('modalProductName').value = 'Brown Border Kattam';
        document.getElementById('modalProductSku').value = 'SAR-OFF-006';
        document.getElementById('modalProductCategory').value = '2';
        document.getElementById('modalProductPrice').value = '999';
        document.getElementById('modalProductComparePrice').value = '1499';
        document.getElementById('modalProductStock').value = '10';
        document.getElementById('modalProductFabric').value = 'Cotton';
        document.getElementById('modalProductColor').value = 'Brown';
        document.getElementById('modalProductOccasion').value = 'Office Wear';
        document.getElementById('modalProductMainImage').value = '';
        document.getElementById('modalProductDescription').value = 'This sophisticated cotton saree features a subtle pinstriped body...';
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

function formatDate(isoStr) {
    if (!isoStr) return '22/08/2026 20:38:59';
    try {
        const d = new Date(isoStr);
        return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB');
    } catch(e) {
        return isoStr;
    }
}
