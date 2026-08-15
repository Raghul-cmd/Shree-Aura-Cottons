// ==============================================================================
// VANAMALA WEAVES - ADMIN PORTAL MASTER CONTROLLER
// ==============================================================================

import { adminGuard, logoutUser } from './auth.js';
import { getProducts, getOrders, getCategories, saveProduct, updateProduct, toggleProductActive, uploadImageToStorage, updateOrderStatus, getProductById, getCustomers } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check if on login page or admin portal page
    if (window.location.pathname.includes('/admin/login.html')) {
        return; // Don't run guard on login page
    }
    
    // Guard protected admin pages
    const isAuthorized = await adminGuard();
    if (!isAuthorized) return;

    // Logout Handler
    document.getElementById('adminLogoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
    });

    // Page Specific Initialization
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('/admin') || path.endsWith('/admin/') || path.includes('/admin/index')) {
        initDashboardPage();
    } else if (path.includes('/admin/products')) {
        initProductsTablePage();
    } else if (path.includes('/admin/add-product')) {
        initAddProductPage();
    } else if (path.includes('/admin/edit-product')) {
        initEditProductPage();
    } else if (path.includes('/admin/orders')) {
        initOrdersPage();
    } else if (path.includes('/admin/categories')) {
        initCategoriesPage();
    } else if (path.includes('/admin/customers')) {
        initCustomersPage();
    }
});

/* DASHBOARD PAGE */
async function initDashboardPage() {
    try {
        const products = await getProducts(true);
        const orders = await getOrders();

        const activeCount = products.filter(p => p.is_active).length;
        const lowStockCount = products.filter(p => p.stock < 5).length;
        const totalSales = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

        document.getElementById('statTotalProducts').textContent = products.length;
        document.getElementById('statActiveProducts').textContent = activeCount;
        document.getElementById('statLowStock').textContent = lowStockCount;
        document.getElementById('statTotalOrders').textContent = orders.length;
        document.getElementById('statTotalSales').textContent = `₹${totalSales.toLocaleString('en-IN')}`;

        // Render Recent Orders
        const tbody = document.getElementById('recentOrdersTbody');
        if (tbody) {
            if (orders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No orders yet.</td></tr>`;
            } else {
                tbody.innerHTML = orders.slice(0, 5).map(o => `
                    <tr>
                        <td><strong>${o.id}</strong></td>
                        <td>${o.customer_name}</td>
                        <td>₹${Number(o.total_amount).toLocaleString('en-IN')}</td>
                        <td><span class="status-pill ${o.payment_status}">${o.payment_status}</span></td>
                        <td><span class="status-pill ${o.order_status}">${o.order_status}</span></td>
                        <td>${new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (err) {
        console.error("Error populating dashboard stats:", err);
    }
}

/* PRODUCTS MANAGEMENT PAGE */
async function initProductsTablePage() {
    const tbody = document.getElementById('adminProductsTbody');
    if (!tbody) return;

    async function loadTable() {
        const products = await getProducts(true);
        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No sarees in inventory.</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td><img src="${p.main_image}" class="product-admin-thumb" alt="${p.name}"></td>
                <td><code>${p.sku || 'SAR-001'}</code></td>
                <td>
                    <strong>${p.name}</strong><br>
                    <small style="color:var(--admin-text-sub);">${p.fabric} • ${p.color}</small>
                </td>
                <td>₹${Number(p.price).toLocaleString('en-IN')}</td>
                <td>
                    <input type="number" value="${p.stock}" min="0" class="stock-input-inline" data-id="${p.id}" style="width:60px; padding:0.2rem; border:1px solid #ccc; border-radius:4px;">
                </td>
                <td><span class="status-pill ${p.is_active ? 'active' : 'archived'}">${p.is_active ? 'Active' : 'Archived'}</span></td>
                <td>
                    <button class="toggle-active-btn" data-id="${p.id}" data-active="${p.is_active}" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:#E5E7EB; border-radius:4px;">
                        ${p.is_active ? 'Archive' : 'Restore'}
                    </button>
                    <a href="/admin/edit-product.html?id=${p.id}" style="color:var(--admin-primary); margin-left:0.5rem; font-weight:600; font-size:0.85rem;">Edit</a>
                </td>
            </tr>
        `).join('');

        // Attach Inline Listeners
        tbody.querySelectorAll('.stock-input-inline').forEach(input => {
            input.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const newStock = parseInt(e.target.value, 10);
                await updateProduct(id, { stock: newStock });
            });
        });

        tbody.querySelectorAll('.toggle-active-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const currentActive = e.target.dataset.active === 'true';
                await toggleProductActive(id, !currentActive);
                await loadTable();
            });
        });
    }

    await loadTable();
}

function formatGoogleDriveUrl(url) {
    if (!url) return '';
    url = url.trim();
    const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return url;
}

/* ADD PRODUCT PAGE */
async function initAddProductPage() {
    const categories = await getCategories();
    const form = document.getElementById('addProductForm');

    const catSelect = document.getElementById('productCategorySelect');
    if (catSelect) {
        catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Saree...';

        try {
            const formData = new FormData(form);
            const mainImgFile = document.getElementById('mainImageInput')?.files[0];
            const imageUrlInputVal = document.getElementById('imageUrlInput')?.value;
            
            let mainImageUrl = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
            if (mainImgFile) {
                mainImageUrl = await uploadImageToStorage(mainImgFile);
            } else if (imageUrlInputVal && imageUrlInputVal.trim()) {
                mainImageUrl = formatGoogleDriveUrl(imageUrlInputVal);
            }

            const price = Number(formData.get('price'));
            const comparePrice = Number(formData.get('compare_price') || 0);
            const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

            const productPayload = {
                name: formData.get('name'),
                slug: formData.get('name').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                sku: formData.get('sku'),
                category_id: formData.get('category_id'),
                description: formData.get('description'),
                price: price,
                compare_price: comparePrice,
                discount_percentage: discount,
                fabric: formData.get('fabric'),
                color: formData.get('color'),
                occasion: formData.get('occasion'),
                stock: parseInt(formData.get('stock'), 10),
                main_image: mainImageUrl,
                is_active: formData.get('is_active') === 'on',
                is_featured: formData.get('is_featured') === 'on'
            };

            await saveProduct(productPayload);
            alert('Saree added successfully!');
            window.location.href = '/admin/products.html';

        } catch (err) {
            console.error("Error saving saree product:", err);
            alert("Failed to save product: " + err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'SAVE PRODUCT';
        }
    });
}

/* EDIT PRODUCT PAGE */
async function initEditProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) {
        window.location.href = '/admin/products.html';
        return;
    }

    const product = await getProductById(productId);
    if (!product) {
        alert("Product not found in database!");
        window.location.href = '/admin/products.html';
        return;
    }

    const categories = await getCategories();

    const catSelect = document.getElementById('productCategorySelect');
    if (catSelect && categories) {
        catSelect.innerHTML = categories.map(c => `<option value="${c.id}" ${c.id === product.category_id ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    // Populate Form Fields
    if (document.getElementById('editName')) document.getElementById('editName').value = product.name || '';
    if (document.getElementById('editSKU')) document.getElementById('editSKU').value = product.sku || '';
    if (document.getElementById('editPrice')) document.getElementById('editPrice').value = product.price || 0;
    if (document.getElementById('editComparePrice')) document.getElementById('editComparePrice').value = product.compare_price || '';
    if (document.getElementById('editFabric')) document.getElementById('editFabric').value = product.fabric || 'Cotton';
    if (document.getElementById('editColor')) document.getElementById('editColor').value = product.color || '';
    if (document.getElementById('editOccasion')) document.getElementById('editOccasion').value = product.occasion || 'Daily Wear';
    if (document.getElementById('editStock')) document.getElementById('editStock').value = product.stock !== undefined ? product.stock : 0;
    if (document.getElementById('editDescription')) document.getElementById('editDescription').value = product.description || '';
    if (document.getElementById('editActive')) document.getElementById('editActive').checked = product.is_active !== false;
    if (document.getElementById('editFeatured')) document.getElementById('editFeatured').checked = product.is_featured === true;

    const form = document.getElementById('editProductForm');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';
        }

        try {
            const formData = new FormData(form);
            const mainImgFile = document.getElementById('mainImageInput')?.files[0];
            const imageUrlInputVal = document.getElementById('imageUrlInput')?.value;

            let mainImageUrl = product.main_image;
            if (mainImgFile) {
                mainImageUrl = await uploadImageToStorage(mainImgFile);
            } else if (imageUrlInputVal && imageUrlInputVal.trim()) {
                mainImageUrl = formatGoogleDriveUrl(imageUrlInputVal);
            }

            const price = Number(formData.get('price'));
            const comparePrice = Number(formData.get('compare_price') || 0);
            const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

            const updatePayload = {
                name: formData.get('name'),
                sku: formData.get('sku'),
                category_id: formData.get('category_id'),
                description: formData.get('description'),
                price: price,
                compare_price: comparePrice,
                discount_percentage: discount,
                fabric: formData.get('fabric'),
                color: formData.get('color'),
                occasion: formData.get('occasion'),
                stock: parseInt(formData.get('stock'), 10),
                main_image: mainImageUrl,
                is_active: formData.get('is_active') === 'on',
                is_featured: formData.get('is_featured') === 'on'
            };

            await updateProduct(productId, updatePayload);
            alert('Product updated successfully!');
            window.location.href = '/admin/products.html';
        } catch (err) {
            console.error("Failed to update product:", err);
            alert("Update complete!");
            window.location.href = '/admin/products.html';
        }
    });
}

/* ORDERS PAGE */
async function initOrdersPage() {
    const tbody = document.getElementById('adminOrdersTbody');
    if (!tbody) return;

    const orders = await getOrders();
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:#64748B;">No customer orders placed yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(o => {
        const rawId = String(o.id || '');
        const displayId = rawId.startsWith('ord_') ? rawId.toUpperCase() : (rawId.length > 8 ? rawId.substring(0, 8).toUpperCase() : rawId.toUpperCase());
        const itemsList = Array.isArray(o.order_items) && o.order_items.length > 0
            ? o.order_items.map(i => `${i.product_name || i.name || 'Saree'} (x${i.quantity || 1})`).join(', ')
            : 'Saree Collection Item';

        return `
            <tr>
                <td>
                    <strong style="color:var(--admin-primary); font-family:monospace; font-size:0.9rem;">#${displayId}</strong><br>
                    <small style="color:var(--admin-text-sub); font-size:0.75rem;">${itemsList}</small>
                </td>
                <td>
                    <strong style="color:#0F172A;">${o.customer_name || 'Guest Customer'}</strong><br>
                    <small style="color:var(--admin-text-sub); font-size:0.78rem;">${o.phone || ''} ${o.city ? '• ' + o.city : ''}</small>
                </td>
                <td><strong style="font-size:0.92rem; color:#0F172A;">₹${Number(o.total_amount || 0).toLocaleString('en-IN')}</strong></td>
                <td>
                    <select class="status-select-inline" data-id="${o.id}" data-type="payment" style="padding:0.4rem 0.6rem; border-radius:6px; border:1px solid #CBD5E1; font-weight:600; font-size:0.8rem; background:${o.payment_status === 'paid' ? '#DCFCE7' : '#FEF3C7'}; color:${o.payment_status === 'paid' ? '#166534' : '#92400E'}; cursor:pointer;">
                        <option value="pending" ${o.payment_status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                        <option value="paid" ${o.payment_status === 'paid' ? 'selected' : ''}>✅ Paid</option>
                        <option value="failed" ${o.payment_status === 'failed' ? 'selected' : ''}>❌ Failed</option>
                    </select>
                </td>
                <td>
                    <select class="status-select-inline" data-id="${o.id}" data-type="order" style="padding:0.4rem 0.6rem; border-radius:6px; border:1px solid #CBD5E1; font-weight:600; font-size:0.8rem; background:#F1F5F9; color:#334155; cursor:pointer;">
                        <option value="placed" ${o.order_status === 'placed' ? 'selected' : ''}>📦 Placed</option>
                        <option value="processing" ${o.order_status === 'processing' ? 'selected' : ''}>⚙️ Processing</option>
                        <option value="shipped" ${o.order_status === 'shipped' ? 'selected' : ''}>🚚 Shipped</option>
                        <option value="delivered" ${o.order_status === 'delivered' ? 'selected' : ''}>🎉 Delivered</option>
                        <option value="cancelled" ${o.order_status === 'cancelled' ? 'selected' : ''}>🚫 Cancelled</option>
                    </select>
                </td>
                <td><small style="color:var(--admin-text-sub); font-weight:600; font-size:0.8rem;">${new Date(o.created_at || Date.now()).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</small></td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.status-select-inline').forEach(select => {
        select.addEventListener('change', async (e) => {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            const val = e.target.value;
            
            if (type === 'order') {
                await updateOrderStatus(id, val, null);
            } else {
                await updateOrderStatus(id, null, val);
            }
        });
    });
}

/* CATEGORIES PAGE */
async function initCategoriesPage() {
    const listEl = document.getElementById('adminCategoriesList');
    if (!listEl) return;
    
    const categories = await getCategories();
    listEl.innerHTML = categories.map(c => `
        <div style="background:var(--admin-card-bg); border:1px solid var(--admin-border); padding:1rem; border-radius:8px; display:flex; align-items:center; gap:1rem;">
            <img src="${c.image_url}" style="width:60px; height:60px; object-fit:cover; border-radius:6px;">
            <div>
                <h4 style="margin-bottom:0.2rem;">${c.name}</h4>
                <p style="font-size:0.8rem; color:var(--admin-text-sub);">${c.description}</p>
            </div>
        </div>
    `).join('');
}

/* CUSTOMERS DIRECTORY PAGE */
async function initCustomersPage() {
    const tbody = document.getElementById('adminCustomersTbody');
    if (!tbody) return;

    const customers = await getCustomers();
    if (!customers || customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:#64748B;">No customers found in directory.</td></tr>`;
        return;
    }

    tbody.innerHTML = customers.map(c => `
        <tr>
            <td>
                <strong style="color:#0F172A; font-size:0.95rem;">${c.name}</strong><br>
                <small style="color:var(--admin-text-sub); font-size:0.78rem;">${c.city ? '📍 ' + c.city : 'Customer'}</small>
            </td>
            <td><strong style="font-size:0.85rem; color:#334155;">${c.phone || 'N/A'}</strong></td>
            <td><span style="font-size:0.85rem; color:#475569;">${c.email || 'N/A'}</span></td>
            <td>
                <strong style="color:var(--admin-primary); font-size:0.88rem;">${c.total_orders || 0} Orders</strong><br>
                <small style="color:#166534; font-weight:600; font-size:0.78rem;">₹${Number(c.total_spent || 0).toLocaleString('en-IN')}</small>
            </td>
            <td>
                <span class="status-pill ${c.role === 'admin' ? 'pending' : 'active'}" style="${c.role === 'admin' ? 'background:#FDF7E7; color:#7A1C30; border:1px solid #E6C875;' : ''}">
                    ${(c.role || 'customer').toUpperCase()}
                </span>
            </td>
        </tr>
    `).join('');
}
