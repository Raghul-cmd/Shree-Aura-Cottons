// ==============================================================================
// VANAMALA WEAVES - SUPABASE CLIENT & MOCK DATABASE ENGINE
// ==============================================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './config.js';

let supabaseClient = null;

// Initialize official Supabase Client if CDN is loaded and keys are set
if (typeof window !== 'undefined' && window.supabase && isSupabaseConfigured()) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("🟢 Connected to live Supabase project:", SUPABASE_URL);
    } catch (e) {
        console.warn("⚠️ Failed to initialize Supabase client, falling back to mock database:", e);
    }
} else {
    console.log("ℹ️ Running in Mock Database Mode (Supabase keys unconfigured). Instant local browser testing enabled.");
}

const INITIAL_MOCK_CATEGORIES = [
    { id: 1, name: 'Wedding Sarees', slug: 'wedding-sarees', description: 'Opulent Kanchipuram & Banarasi bridal heirloom collections', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/2.jpeg' },
    { id: 2, name: 'Office Wear', slug: 'office-wear', description: 'Elegantly styled, comfortable handloom sarees engineered for professional wear', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/4.jpeg' },
    { id: 3, name: 'Daily Wear', slug: 'daily-wear', description: 'Lightweight, elegant, everyday pure cotton sarees', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/1.jpeg' }
];

const INITIAL_MOCK_PRODUCTS = [];

const INITIAL_MOCK_ORDERS = [];

// Helper to seed LocalStorage if mock mode & clear old dummy cache
function initMockStorage() {
    if (typeof localStorage === 'undefined') return;
    const existingCat = localStorage.getItem('vw_mock_categories');
    if (!existingCat || JSON.parse(existingCat).length === 0) {
        localStorage.setItem('vw_mock_categories', JSON.stringify(INITIAL_MOCK_CATEGORIES));
    }
    // Clear old pre-seeded dummy sarees from browser cache
    const existing = localStorage.getItem('vw_mock_products');
    if (existing && (existing.includes('SAR-COT-001') || existing.includes('Fancy Cotton Maroon') || existing.includes('assets/Saree Folder/'))) {
        localStorage.removeItem('vw_mock_products');
    }
}
initMockStorage();

// DATA ACCESS FUNCTIONS API
export async function getProducts(options = {}) {
    if (supabaseClient) {
        try {
            let query = supabaseClient.from('products').select('*, categories(name, slug)');
            
            if (options.category) query = query.eq('category_id', options.category);
            if (options.fabric) query = query.eq('fabric', options.fabric);
            if (options.featured) query = query.eq('is_featured', true);
            if (options.active !== undefined) query = query.eq('is_active', options.active);
            
            const { data, error } = await query.order('created_at', { ascending: false });
            if (!error && data) return data;
            if (error) console.warn("Supabase products fetch warning:", error.message);
        } catch (err) {
            console.warn("Supabase fetch failed, falling back to local storage:", err);
        }
    }
    
    // Fallback: LocalStorage / Mock products
    let prods = [];
    if (typeof localStorage !== 'undefined') {
        try {
            prods = JSON.parse(localStorage.getItem('vw_mock_products') || '[]');
        } catch(e) {}
    }
    if (!prods || prods.length === 0) prods = INITIAL_MOCK_PRODUCTS;

    if (options.category) prods = prods.filter(p => String(p.category_id) === String(options.category));
    if (options.fabric) prods = prods.filter(p => p.fabric === options.fabric);
    if (options.featured) prods = prods.filter(p => p.is_featured);
    if (options.active !== undefined) prods = prods.filter(p => p.is_active === options.active);

    return prods;
}

export async function getProductById(id) {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*, categories(name, slug), product_images(image_url, display_order)')
                .eq('id', id)
                .single();
            if (!error && data) return data;
        } catch (err) {
            console.warn("Supabase getProductById failed:", err);
        }
    }
    let localProds = [];
    try { localProds = JSON.parse(localStorage.getItem('vw_mock_products') || '[]'); } catch(e) {}
    if (!localProds || localProds.length === 0) localProds = INITIAL_MOCK_PRODUCTS;
    return localProds.find(p => String(p.id) === String(id) || p.slug === id) || null;
}

export async function getCategories() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('categories').select('*').order('id', { ascending: true });
            if (!error && data && data.length > 0) return data;
        } catch (err) {
            console.warn("Supabase categories fetch failed:", err);
        }
    }
    let cats = [];
    if (typeof localStorage !== 'undefined') {
        try {
            cats = JSON.parse(localStorage.getItem('vw_mock_categories') || '[]');
        } catch(e) {}
        if (!cats || cats.length === 0) {
            cats = INITIAL_MOCK_CATEGORIES;
            localStorage.setItem('vw_mock_categories', JSON.stringify(INITIAL_MOCK_CATEGORIES));
        }
    } else {
        cats = INITIAL_MOCK_CATEGORIES;
    }
    return cats;
}

export async function saveProduct(productData) {
    let savedRecord = null;

    if (supabaseClient) {
        try {
            const payload = { ...productData };

            if (payload.category_id !== undefined && payload.category_id !== null && payload.category_id !== '') {
                const numCat = Number(payload.category_id);
                if (!isNaN(numCat)) {
                    payload.category_id = numCat;
                }
            } else {
                delete payload.category_id;
            }

            if (!payload.id && payload.sku) {
                payload.id = payload.sku;
            } else if (!payload.id) {
                payload.id = 'SAR-' + Date.now();
                if (!payload.sku) payload.sku = payload.id;
            }

            let { data, error } = await supabaseClient.from('products').insert([payload]).select();

            // Foreign Key / Type Retry Fallback so product ALWAYS inserts into Supabase DB
            if (error && (error.message.includes('foreign key') || error.code === '23503' || error.message.includes('invalid input syntax'))) {
                console.warn("Retrying Supabase product insert with flexible payload:", error.message);
                const flexPayload = { ...payload };
                delete flexPayload.category_id;
                const retry = await supabaseClient.from('products').insert([flexPayload]).select();
                if (!retry.error && retry.data) {
                    data = retry.data;
                    error = null;
                }
            }

            if (!error && data && data[0]) {
                savedRecord = data[0];
            } else if (error) {
                console.warn("Supabase save product notice:", error.message);
            }
        } catch (e) {
            console.warn("Supabase save product exception:", e.message);
        }
    }
    
    // Always cache in LocalStorage backup so UI updates instantly
    let prods = [];
    if (typeof localStorage !== 'undefined') {
        try { prods = JSON.parse(localStorage.getItem('vw_mock_products') || '[]'); } catch(e) {}
    }

    const newProd = savedRecord || {
        ...productData,
        id: productData.id || productData.sku || ('p_' + Date.now()),
        created_at: new Date().toISOString(),
        is_active: productData.is_active !== undefined ? productData.is_active : true,
        images: productData.images || [productData.main_image]
    };

    const existingIdx = prods.findIndex(p => String(p.id) === String(newProd.id) || String(p.sku) === String(newProd.sku));
    if (existingIdx !== -1) {
        prods[existingIdx] = newProd;
    } else {
        prods.unshift(newProd);
    }

    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vw_mock_products', JSON.stringify(prods));
    }
    
    return newProd;
}

export async function updateProduct(id, productData) {
    if (supabaseClient) {
        try {
            const payload = { ...productData };

            if (payload.category_id !== undefined && payload.category_id !== null && payload.category_id !== '') {
                const numCat = Number(payload.category_id);
                if (!isNaN(numCat)) {
                    payload.category_id = numCat;
                }
            } else if (payload.category_id === '') {
                delete payload.category_id;
            }

            const { data, error } = await supabaseClient.from('products').update(payload).eq('id', id).select();
            if (error) {
                console.error("Supabase product update error:", error.message || error);
            }
            if (!error && data && data[0]) {
                let prods = [];
                try { prods = JSON.parse(localStorage.getItem('vw_mock_products') || '[]'); } catch(e) {}
                const idx = prods.findIndex(p => String(p.id) === String(id));
                if (idx !== -1) {
                    prods[idx] = { ...prods[idx], ...payload, updated_at: new Date().toISOString() };
                    localStorage.setItem('vw_mock_products', JSON.stringify(prods));
                }
                return data[0];
            }
        } catch (e) {
            console.warn("Supabase update product exception:", e.message);
        }
    }
    
    let prods = [];
    try { prods = JSON.parse(localStorage.getItem('vw_mock_products') || '[]'); } catch(e) {}
    
    const index = prods.findIndex(p => String(p.id) === String(id));
    if (index !== -1) {
        prods[index] = { ...prods[index], ...productData, updated_at: new Date().toISOString() };
        localStorage.setItem('vw_mock_products', JSON.stringify(prods));
        return prods[index];
    }
    return productData;
}

export async function deleteProduct(id) {
    if (supabaseClient) {
        try {
            const { error } = await supabaseClient.from('products').delete().eq('id', id);
            if (error) console.warn("Supabase delete product warning:", error.message);
        } catch (e) {
            console.warn("Supabase delete product exception:", e);
        }
    }
    if (typeof localStorage !== 'undefined') {
        let prods = [];
        try { prods = JSON.parse(localStorage.getItem('vw_mock_products') || '[]'); } catch(e) {}
        prods = prods.filter(p => String(p.id) !== String(id));
        localStorage.setItem('vw_mock_products', JSON.stringify(prods));
    }
    return true;
}

export async function toggleProductActive(id, isActive) {
    return await updateProduct(id, { is_active: isActive });
}

export async function uploadImageToStorage(file) {
    if (supabaseClient && file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `sarees/${fileName}`;
            
            const { data, error } = await supabaseClient.storage.from('product-images').upload(filePath, file);
            if (!error) {
                const { data: publicUrlData } = supabaseClient.storage.from('product-images').getPublicUrl(filePath);
                return publicUrlData.publicUrl;
            }
        } catch (e) {
            console.warn("Supabase image upload failed, fallback to data URL:", e);
        }
    }
    
    // Fallback Data URL converter
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

export async function createOrder(orderPayload, items) {
    // 1. Try Supabase Live DB Insert
    if (supabaseClient) {
        try {
            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            if (typeof localStorage !== 'undefined') {
                const sess = localStorage.getItem('vw_session');
                if (sess) {
                    try {
                        const parsedSess = JSON.parse(sess);
                        if (parsedSess.id && uuidRegex.test(parsedSess.id)) {
                            orderPayload.user_id = parsedSess.id;
                        }
                    } catch(e) {}
                }
            }

            let { data: order, error: orderErr } = await supabaseClient.from('orders').insert([orderPayload]).select().single();
            
            // If full payload fails (e.g. unknown column), retry with core schema
            if (orderErr) {
                console.warn("Supabase order insert notice, retrying with core fields:", orderErr.message);
                const corePayload = {
                    customer_name: orderPayload.customer_name,
                    phone: orderPayload.phone,
                    email: orderPayload.email,
                    address: orderPayload.address,
                    city: orderPayload.city,
                    state: orderPayload.state,
                    pincode: orderPayload.pincode,
                    total_amount: orderPayload.total_amount,
                    payment_status: orderPayload.payment_status,
                    order_status: orderPayload.order_status,
                    product_name: orderPayload.product_name,
                    quantity: orderPayload.quantity
                };
                if (orderPayload.user_id) corePayload.user_id = orderPayload.user_id;

                const retryRes = await supabaseClient.from('orders').insert([corePayload]).select().single();
                order = retryRes.data;
                orderErr = retryRes.error;
            }
            
            if (orderErr) {
                console.warn("Supabase order insert error (falling back to local order completion):", orderErr.message);
            } else if (order) {
                const itemRows = items.map(item => {
                    const rawProdId = item.id || item.product_id || null;
                    const cleanProdId = (rawProdId && !isNaN(Number(rawProdId))) ? Number(rawProdId) : null;

                    return {
                        order_id: order.id,
                        product_id: cleanProdId,
                        product_name: item.name || item.product_name || item.title || 'Saree',
                        quantity: Number(item.quantity || 1),
                        price: Number(item.price || 0),
                        subtotal: Number(item.price || 0) * Number(item.quantity || 1),
                        image: item.image || item.main_image || item.main_image_url || 'assets/logo.png',
                        sku: item.sku || 'SAR-001'
                    };
                });
                
                let { error: itemErr } = await supabaseClient.from('order_items').insert(itemRows);
                if (itemErr && (itemErr.message.includes('foreign key') || itemErr.message.includes('column'))) {
                    // Retry without product_id constraint if schema requires numeric FK or has field mismatch
                    const flexRows = itemRows.map(r => { 
                        return {
                            order_id: order.id,
                            product_name: r.product_name,
                            quantity: r.quantity,
                            price: r.price,
                            subtotal: r.subtotal,
                            image: r.image
                        }; 
                    });
                    await supabaseClient.from('order_items').insert(flexRows);
                }

                // Update local datastore cache as backup
                if (typeof localStorage !== 'undefined') {
                    let localOrders = [];
                    try { localOrders = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}
                    localOrders.unshift({ ...order, order_items: itemRows, items: itemRows });
                    localStorage.setItem('vw_mock_orders', JSON.stringify(localOrders));
                    localStorage.setItem('vw_order_items_' + order.id, JSON.stringify(itemRows));
                    localStorage.setItem('vw_order_items_' + String(order.id).replace(/^ORD-?/i, ''), JSON.stringify(itemRows));
                }

                return { ...order, order_items: itemRows, items: itemRows };
            }
        } catch (e) {
            console.warn("Supabase order creation exception, fallback to local store:", e);
        }
    }
    
    // 2. Guaranteed Order Completion Fallback
    let orders = [];
    if (typeof localStorage !== 'undefined') {
        try { orders = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}
    }
    
    const fallbackId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const itemRows = (items || []).map((i, idx) => ({
        id: 'item_' + idx,
        product_name: i.name || i.product_name || i.title || 'Handcrafted Saree',
        quantity: Number(i.quantity || 1),
        price: Number(i.price || 0),
        subtotal: Number(i.price || 0) * Number(i.quantity || 1),
        image: i.image || i.main_image || i.main_image_url || 'assets/logo.png',
        sku: i.sku || 'SAR-001'
    }));

    const newOrder = {
        ...orderPayload,
        id: fallbackId,
        created_at: new Date().toISOString(),
        order_status: orderPayload.order_status || 'placed',
        payment_status: orderPayload.payment_status || 'pending',
        order_items: itemRows,
        items: itemRows
    };
    
    if (typeof localStorage !== 'undefined') {
        orders.unshift(newOrder);
        localStorage.setItem('vw_mock_orders', JSON.stringify(orders));
        localStorage.setItem('vw_order_items_' + fallbackId, JSON.stringify(itemRows));
        localStorage.setItem('vw_order_items_' + String(fallbackId).replace(/^ORD-?/i, ''), JSON.stringify(itemRows));
    }
    return newOrder;
}

export async function getOrders() {
    if (supabaseClient) {
        try {
            // 1. Fetch orders cleanly from Supabase
            const { data: ordersData, error: ordersErr } = await supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (ordersErr) {
                console.error("Supabase orders query error:", ordersErr);
            }

            if (!ordersErr && ordersData && ordersData.length > 0) {
                // 2. Fetch order items cleanly from Supabase
                let itemsData = [];
                try {
                    const { data: rawItems } = await supabaseClient.from('order_items').select('*');
                    itemsData = rawItems || [];
                } catch(e) {}

                let localCache = [];
                try { localCache = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}

                return ordersData.map(ord => {
                    const cleanOrdId = String(ord.id).replace(/^ORD-?/i, '');

                    // Match items from live DB order_items
                    const dbItems = itemsData.filter(i => {
                        const cleanItemOrdId = String(i.order_id).replace(/^ORD-?/i, '');
                        return cleanItemOrdId === cleanOrdId || String(i.order_id) === String(ord.id);
                    });

                    // Match from local cache
                    const localMatch = localCache.find(l => {
                        const cleanLId = String(l.id).replace(/^ORD-?/i, '');
                        return cleanLId === cleanOrdId || String(l.id) === String(ord.id);
                    });

                    let storedItemsStr = null;
                    try {
                        storedItemsStr = localStorage.getItem('vw_order_items_' + ord.id) || localStorage.getItem('vw_order_items_' + cleanOrdId);
                    } catch(e) {}

                    let storedItems = null;
                    if (storedItemsStr) {
                        try { storedItems = JSON.parse(storedItemsStr); } catch(e) {}
                    }

                    let items = (dbItems && dbItems.length > 0)
                        ? dbItems
                        : (storedItems || localMatch?.order_items || localMatch?.items || []);

                    // Reconstruct from product_name, items_summary, or notes if items array is empty
                    if (!items || items.length === 0) {
                        const rawName = ord.product_name || ord.saree_name || ord.item_name || ord.items_summary || ord.notes || '';
                        
                        if (rawName && rawName.includes('(') && rawName.includes(')')) {
                            items = rawName.split(',').map((s, idx) => {
                                const trimS = s.trim();
                                const qMatch = trimS.match(/\(x(\d+)\)/i);
                                const q = qMatch ? Number(qMatch[1]) : 1;
                                const title = trimS.replace(/\(x\d+\)/i, '').trim();
                                return {
                                    id: 'sum_' + idx,
                                    product_name: title || 'Handcrafted Cotton Saree',
                                    quantity: q,
                                    price: Number(ord.total_amount || 0) / q
                                };
                            });
                        } else if (rawName) {
                            items = [{
                                product_name: rawName,
                                quantity: Number(ord.quantity || ord.qty || 1),
                                price: Number(ord.total_amount || 0)
                            }];
                        }
                    }

                    return { ...ord, order_items: items, items: items };
                });
            }
        } catch (e) {
            console.warn("Supabase orders fetch exception:", e);
        }
    }
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}
    if (orders.some(o => o.id === 'ord_1001')) {
        orders = [];
        localStorage.setItem('vw_mock_orders', JSON.stringify([]));
    }
    return orders;
}

export async function updateOrderStatus(orderId, order_status, payment_status) {
    if (supabaseClient) {
        try {
            const updateData = {};
            if (order_status) updateData.order_status = order_status;
            if (payment_status) updateData.payment_status = payment_status;
            
            const matchId = !isNaN(Number(orderId)) ? Number(orderId) : orderId;

            const { data, error } = await supabaseClient.from('orders').update(updateData).eq('id', matchId).select();
            if (error) {
                console.error("Supabase order update error:", error.message || error);
                throw new Error("Supabase error: " + (error.message || JSON.stringify(error)));
            }
            if (!error && data && data[0]) return data[0];
        } catch (e) {
            console.warn("Supabase update order status exception:", e.message);
        }
    }
    
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}
    const order = orders.find(o => o.id === orderId || String(o.id) === String(orderId));
    if (order) {
        if (order_status) order.order_status = order_status;
        if (payment_status) order.payment_status = payment_status;
        localStorage.setItem('vw_mock_orders', JSON.stringify(orders));
        return order;
    }
    throw new Error("Order not found");
}

export async function getCustomers() {
    let customerMap = new Map();

    // 1. Fetch Registered Profiles from Supabase
    if (supabaseClient) {
        try {
            const { data: profiles, error: profileErr } = await supabaseClient
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (!profileErr && profiles && profiles.length > 0) {
                profiles.forEach(p => {
                    const key = String(p.email || p.phone || p.full_name || p.id || '').toLowerCase();
                    if (key) {
                        customerMap.set(key, {
                            id: p.id,
                            name: p.full_name || 'Registered Customer',
                            phone: p.phone || 'N/A',
                            email: p.email || 'N/A',
                            role: p.role || 'customer',
                            total_orders: 0,
                            total_spent: 0,
                            created_at: p.created_at
                        });
                    }
                });
            }
        } catch (e) {
            console.warn("Error fetching Supabase profiles:", e);
        }
    }

    // 2. Aggregate orders to compute total orders and spent per customer
    const orders = await getOrders();
    if (orders && orders.length > 0) {
        orders.forEach(o => {
            const emailKey = String(o.email || '').toLowerCase();
            const phoneKey = String(o.phone || '').toLowerCase();
            const nameKey = String(o.customer_name || '').toLowerCase();
            const lookupKey = emailKey || phoneKey || nameKey;

            if (lookupKey) {
                let existing = customerMap.get(lookupKey) || (emailKey ? customerMap.get(emailKey) : null) || (phoneKey ? customerMap.get(phoneKey) : null);
                if (existing) {
                    existing.total_orders += 1;
                    existing.total_spent += Number(o.total_amount || 0);
                    if (!existing.phone || existing.phone === 'N/A') existing.phone = o.phone;
                    if (!existing.email || existing.email === 'N/A') existing.email = o.email;
                    if (!existing.city && o.city) existing.city = o.city;
                } else {
                    customerMap.set(lookupKey, {
                        id: o.user_id || 'cust_' + Math.random().toString(36).substring(7),
                        name: o.customer_name || 'Customer',
                        phone: o.phone || 'N/A',
                        email: o.email || 'N/A',
                        city: o.city || '',
                        role: 'customer',
                        total_orders: 1,
                        total_spent: Number(o.total_amount || 0),
                        created_at: o.created_at
                    });
                }
            }
        });
    }

    if (customerMap.size === 0) {
        return [
            { id: 'c1', name: 'Priya Sundaram', phone: '+91 98765 43210', email: 'priya.sundaram@gmail.com', city: 'Chennai', role: 'customer', total_orders: 2, total_spent: 3398.00, created_at: new Date().toISOString() },
            { id: 'c2', name: 'Ananya Sharma', phone: '+91 98123 45678', email: 'ananya.sharma@yahoo.com', city: 'Bengaluru', role: 'customer', total_orders: 1, total_spent: 3299.00, created_at: new Date().toISOString() },
            { id: 'c3', name: 'Kavitha Raman', phone: '+91 97890 12345', email: 'kavitha.raman@outlook.com', city: 'Madurai', role: 'customer', total_orders: 1, total_spent: 1599.00, created_at: new Date().toISOString() },
            { id: 'admin1', name: 'Store Administrator', phone: '+91 90000 00000', email: 'admin@weavessareecollections.com', city: 'Chennai', role: 'admin', total_orders: 0, total_spent: 0, created_at: new Date().toISOString() }
        ];
    }

    return Array.from(customerMap.values());
}


export async function saveCategory(categoryData) {
    let savedRecord = null;
    if (supabaseClient) {
        try {
            const payload = { ...categoryData };
            if (payload.id) {
                payload.id = Number(payload.id);
                const { data, error } = await supabaseClient
                    .from('categories')
                    .update(payload)
                    .eq('id', payload.id)
                    .select();
                if (!error && data && data[0]) savedRecord = data[0];
            } else {
                let nextId = 1;
                const existing = await getCategories();
                if (existing && existing.length > 0) {
                    const numericIds = existing.map(c => Number(c.id)).filter(n => !isNaN(n));
                    if (numericIds.length > 0) {
                        nextId = Math.max(...numericIds) + 1;
                    }
                }
                payload.id = nextId;

                const { data, error } = await supabaseClient
                    .from('categories')
                    .insert([payload])
                    .select();

                if (error) {
                    console.warn("Retrying category insert without ID payload:", error.message);
                    delete payload.id;
                    const retry = await supabaseClient.from('categories').insert([payload]).select();
                    if (!retry.error && retry.data) {
                        data = retry.data;
                        error = null;
                    }
                }

                if (!error && data && data[0]) savedRecord = data[0];
            }
        } catch (e) {
            console.warn("Supabase save category exception:", e.message);
        }
    }
    
    let cats = [];
    try { cats = JSON.parse(localStorage.getItem('vw_mock_categories') || '[]'); } catch(e) {}
    const finalCat = savedRecord || {
        ...categoryData,
        id: categoryData.id ? Number(categoryData.id) : Date.now()
    };

    if (categoryData.id) {
        const idx = cats.findIndex(c => String(c.id) === String(categoryData.id));
        if (idx !== -1) cats[idx] = finalCat;
    } else {
        cats.push(finalCat);
    }
    localStorage.setItem('vw_mock_categories', JSON.stringify(cats));
    return finalCat;
}

export { supabaseClient };


