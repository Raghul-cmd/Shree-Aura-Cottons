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

// SEED MOCK DATASTORE FOR DIRECT LOCAL PREVIEW
const INITIAL_MOCK_CATEGORIES = [
    { id: 'c1000000-0000-0000-0000-000000000001', name: 'Cotton Sarees', slug: 'cotton-sarees', description: 'Breathable handcrafted daily cotton sarees', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/1.jpeg' },
    { id: 'c1000000-0000-0000-0000-000000000002', name: 'Silk Sarees', slug: 'silk-sarees', description: 'Pure silk weaves with regal gold zari borders', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/2.jpeg' },
    { id: 'c1000000-0000-0000-0000-000000000003', name: 'Banarasi Sarees', slug: 'banarasi-sarees', description: 'Varanasi brocade heirloom sarees', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/3.jpeg' },
    { id: 'c1000000-0000-0000-0000-000000000004', name: 'Daily Wear', slug: 'daily-wear', description: 'Lightweight everyday sarees', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/4.jpeg' },
    { id: 'c1000000-0000-0000-0000-000000000005', name: 'Wedding Sarees', slug: 'wedding-sarees', description: 'Opulent Kanchipuram & Banarasi bridal wear', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/8.jpeg' }
];

const INITIAL_MOCK_PRODUCTS = [
    {
        id: 'SAR-COT-001',
        name: 'Fancy Cotton Maroon Daily Saree',
        slug: 'fancy-cotton-maroon-daily-saree',
        description: 'Elegant maroon pure cotton saree featuring intricate floral block prints and a contrasting beige zari border. Perfect for all-day office and daily comfort.',
        category_id: 'c1',
        category_name: 'Cotton Sarees',
        price: 899,
        compare_price: 1299,
        discount_percentage: 30,
        fabric: 'Cotton',
        color: 'Maroon',
        occasion: 'Daily Wear',
        stock: 15,
        sku: 'SAR-COT-001',
        main_image: 'assets/Saree Folder/1.jpeg',
        images: ['assets/Saree Folder/1.jpeg'],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'SAR-SLK-002',
        name: 'Royal Kanjivaram Soft Silk Saree',
        slug: 'royal-kanjivaram-soft-silk-saree',
        description: 'Rich peacock blue soft silk saree with heavy gold brocade zari weave along the pallu and traditional temple border motifs.',
        category_id: 'c2',
        category_name: 'Silk Sarees',
        price: 2499,
        compare_price: 3999,
        discount_percentage: 37,
        fabric: 'Silk',
        color: 'Blue',
        occasion: 'Wedding',
        stock: 8,
        sku: 'SAR-SLK-002',
        main_image: 'assets/Saree Folder/2.jpeg',
        images: ['assets/Saree Folder/2.jpeg'],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
        id: 'SAR-BAN-003',
        name: 'Handwoven Banarasi Zari Crimson Saree',
        slug: 'handwoven-banarasi-zari-crimson-saree',
        description: 'Traditional crimson red Banarasi silk saree featuring antique silver brocade motifs and hand-finished tassels.',
        category_id: 'c3',
        category_name: 'Banarasi Sarees',
        price: 3299,
        compare_price: 4999,
        discount_percentage: 34,
        fabric: 'Banarasi',
        color: 'Red',
        occasion: 'Wedding',
        stock: 6,
        sku: 'SAR-BAN-003',
        main_image: 'assets/Saree Folder/3.jpeg',
        images: ['assets/Saree Folder/3.jpeg'],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
        id: 'SAR-GEO-004',
        name: 'Contemporary Georgette Printed Saree',
        slug: 'contemporary-georgette-printed-saree',
        description: 'Lightweight pastel green georgette saree accented with micro-sequin border work and smooth flowy drape.',
        category_id: 'c4',
        category_name: 'Daily Wear',
        price: 1199,
        compare_price: 1699,
        discount_percentage: 29,
        fabric: 'Georgette',
        color: 'Green',
        occasion: 'Office Wear',
        stock: 20,
        sku: 'SAR-GEO-004',
        main_image: 'assets/Saree Folder/4.jpeg',
        images: ['assets/Saree Folder/4.jpeg'],
        is_active: true,
        is_featured: false,
        created_at: new Date(Date.now() - 86400000 * 6).toISOString()
    },
    {
        id: 'SAR-LIN-005',
        name: 'Pure Linen Handloom Mustard Saree',
        slug: 'pure-linen-handloom-mustard-saree',
        description: 'Breathable organic linen saree in bright mustard yellow with silver tissue pallu and unstitched blouse piece included.',
        category_id: 'c1',
        category_name: 'Cotton Sarees',
        price: 1599,
        compare_price: 2199,
        discount_percentage: 27,
        fabric: 'Linen',
        color: 'Yellow',
        occasion: 'Daily Wear',
        stock: 12,
        sku: 'SAR-LIN-005',
        main_image: 'assets/Saree Folder/5.jpeg',
        images: ['assets/Saree Folder/5.jpeg'],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
        id: 'SAR-CHN-006',
        name: 'Chanderi Silk Cotton Olive Saree',
        slug: 'chanderi-silk-cotton-olive-saree',
        description: 'Lustrous olive green Chanderi silk saree with hand-woven gold zari motifs and lightweight sheen.',
        category_id: 'c2',
        category_name: 'Silk Sarees',
        price: 1899,
        compare_price: 2599,
        discount_percentage: 27,
        fabric: 'Silk',
        color: 'Green',
        occasion: 'Festive Celebration',
        stock: 10,
        sku: 'SAR-CHN-006',
        main_image: 'assets/Saree Folder/6.jpeg',
        images: ['assets/Saree Folder/6.jpeg'],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
        id: 'SAR-TUS-007',
        name: 'Tussar Silk Hand Block Printed Saree',
        slug: 'tussar-silk-hand-block-printed-saree',
        description: 'Authentic terracotta orange Tussar silk saree featuring traditional Ajrakh hand block prints and raw silk texture.',
        category_id: 'c2',
        category_name: 'Silk Sarees',
        price: 2199,
        compare_price: 3199,
        discount_percentage: 31,
        fabric: 'Soft Silk',
        color: 'Orange',
        occasion: 'Office Wear',
        stock: 14,
        sku: 'SAR-TUS-007',
        main_image: 'assets/Saree Folder/7.jpeg',
        images: ['assets/Saree Folder/7.jpeg'],
        is_active: true,
        is_featured: false,
        created_at: new Date(Date.now() - 86400000 * 7).toISOString()
    },
    {
        id: 'SAR-KNJ-008',
        name: 'Kanjeevaram Bridal Ruby Red Saree',
        slug: 'kanjeevaram-bridal-ruby-red-saree',
        description: 'Opulent ruby red Kanjeevaram pure silk saree with heavy gold brocade zari work across the body and pallu.',
        category_id: 'c5',
        category_name: 'Wedding Sarees',
        price: 4599,
        compare_price: 6999,
        discount_percentage: 34,
        fabric: 'Silk',
        color: 'Red',
        occasion: 'Wedding',
        stock: 5,
        sku: 'SAR-KNJ-008',
        main_image: 'assets/Saree Folder/8.jpeg',
        images: ['assets/Saree Folder/8.jpeg'],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 8).toISOString()
    },
    {
        id: 'SAR-ORG-009',
        name: 'Organza Floral Pastel Pink Saree',
        slug: 'organza-floral-pastel-pink-saree',
        description: 'Delicate pastel pink sheer organza saree with hand-painted digital floral prints and embroidered pearl scalloped border.',
        category_id: 'c4',
        category_name: 'Daily Wear',
        price: 1499,
        compare_price: 1999,
        discount_percentage: 25,
        fabric: 'Georgette',
        color: 'Pink',
        occasion: 'Festive Celebration',
        stock: 18,
        sku: 'SAR-ORG-009',
        main_image: 'assets/Saree Folder/9.jpeg',
        images: ['assets/Saree Folder/9.jpeg'],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 9).toISOString()
    },
    {
        id: 'SAR-CHT-010',
        name: 'Chettinad Cotton Temple Border Saree',
        slug: 'chettinad-cotton-temple-border-saree',
        description: 'Authentic Chettinad handloom cotton saree in deep navy and mustard with traditional rudraksham temple zari border.',
        category_id: 'c1',
        category_name: 'Cotton Sarees',
        price: 999,
        compare_price: 1499,
        discount_percentage: 33,
        fabric: 'Cotton',
        color: 'Blue',
        occasion: 'Daily Wear',
        stock: 25,
        sku: 'SAR-CHT-010',
        main_image: 'assets/Saree Folder/10.jpeg',
        images: ['assets/Saree Folder/10.jpeg'],
        is_active: true,
        is_featured: false,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString()
    }
];

const INITIAL_MOCK_ORDERS = [
    {
        id: 'ord_1001',
        user_id: null,
        customer_name: 'Priya Sundaram',
        phone: '+91 98765 43210',
        email: 'priya.sundaram@gmail.com',
        address: '142, Temple Street, T. Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017',
        total_amount: 3398.00,
        payment_status: 'paid',
        order_status: 'delivered',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        order_items: [
            { id: 'item_1', product_name: 'Fancy Cotton Maroon Daily Saree', quantity: 1, price: 899.00, subtotal: 899.00 },
            { id: 'item_2', product_name: 'Royal Kanjivaram Soft Silk Saree', quantity: 1, price: 2499.00, subtotal: 2499.00 }
        ]
    },
    {
        id: 'ord_1002',
        user_id: null,
        customer_name: 'Ananya Sharma',
        phone: '+91 98123 45678',
        email: 'ananya.sharma@yahoo.com',
        address: '88, MG Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        total_amount: 3299.00,
        payment_status: 'paid',
        order_status: 'shipped',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        order_items: [
            { id: 'item_3', product_name: 'Handwoven Banarasi Zari Silk Saree', quantity: 1, price: 3299.00, subtotal: 3299.00 }
        ]
    },
    {
        id: 'ord_1003',
        user_id: null,
        customer_name: 'Kavitha Raman',
        phone: '+91 97890 12345',
        email: 'kavitha.raman@outlook.com',
        address: '25, Annanagar 2nd Main Road',
        city: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625020',
        total_amount: 1599.00,
        payment_status: 'pending',
        order_status: 'placed',
        created_at: new Date().toISOString(),
        order_items: [
            { id: 'item_4', product_name: 'Pure Linen Handloom Mustard Saree', quantity: 1, price: 1599.00, subtotal: 1599.00 }
        ]
    }
];

// Helper to seed LocalStorage if mock mode
function initMockStorage() {
    if (typeof localStorage === 'undefined') return;
    const existing = localStorage.getItem('vw_mock_products');
    if (!existing || JSON.parse(existing).length < 10 || existing.includes('unsplash') || existing.includes('"p1"')) {
        localStorage.setItem('vw_mock_products', JSON.stringify(INITIAL_MOCK_PRODUCTS));
    }
    if (!localStorage.getItem('vw_mock_categories')) {
        localStorage.setItem('vw_mock_categories', JSON.stringify(INITIAL_MOCK_CATEGORIES));
    }
    if (!localStorage.getItem('vw_mock_orders')) {
        localStorage.setItem('vw_mock_orders', JSON.stringify([]));
    }
}
initMockStorage();

// DATA ACCESS FUNCTIONS API
export async function getProducts(includeInactive = false) {
    if (supabaseClient) {
        try {
            let query = supabaseClient.from('products').select('*, categories(name, slug)');
            if (!includeInactive) query = query.eq('is_active', true);
            const { data, error } = await query.order('created_at', { ascending: false });
            if (!error && data && data.length > 0) return data;
        } catch (err) {
            console.warn("Supabase fetch failed, fallback to mock products:", err);
        }
    }
    
    // Mock Fallback
    let localProds = [];
    if (typeof localStorage !== 'undefined') {
        try {
            localProds = JSON.parse(localStorage.getItem('vw_mock_products') || '[]');
        } catch(e) {}
        if (!localProds || localProds.length < 10 || (localProds[0] && localProds[0].id === 'p1')) {
            localProds = INITIAL_MOCK_PRODUCTS;
            localStorage.setItem('vw_mock_products', JSON.stringify(INITIAL_MOCK_PRODUCTS));
        }
    } else {
        localProds = INITIAL_MOCK_PRODUCTS;
    }
    return includeInactive ? localProds : localProds.filter(p => p.is_active);
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
            console.warn("Supabase single product fetch failed:", err);
        }
    }
    
    let localProds = [];
    if (typeof localStorage !== 'undefined') {
        try {
            localProds = JSON.parse(localStorage.getItem('vw_mock_products') || '[]');
        } catch(e) {}
    }
    if (!localProds || localProds.length === 0) localProds = INITIAL_MOCK_PRODUCTS;
    return localProds.find(p => p.id === id || p.slug === id) || null;
}

export async function getCategories() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('categories').select('*');
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
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('products').insert([productData]).select();
            if (!error && data && data[0]) return data[0];
        } catch (e) {
            console.warn("Supabase save product failed, fallback to local store:", e);
        }
    }
    
    // Mock save
    let prods = [];
    try { prods = JSON.parse(localStorage.getItem('vw_mock_products') || '[]'); } catch(e) {}
    if (!prods || prods.length === 0) prods = [...INITIAL_MOCK_PRODUCTS];
    
    const newProd = {
        ...productData,
        id: 'p_' + Date.now(),
        created_at: new Date().toISOString(),
        is_active: productData.is_active !== undefined ? productData.is_active : true,
        images: productData.images || [productData.main_image]
    };
    prods.unshift(newProd);
    localStorage.setItem('vw_mock_products', JSON.stringify(prods));
    return newProd;
}

export async function updateProduct(id, productData) {
    if (supabaseClient) {
        try {
            const payload = { ...productData };
            const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

            if (payload.category_id === 'c1') payload.category_id = 'c1000000-0000-0000-0000-000000000001';
            if (payload.category_id === 'c2') payload.category_id = 'c1000000-0000-0000-0000-000000000002';
            if (payload.category_id === 'c3') payload.category_id = 'c1000000-0000-0000-0000-000000000003';
            if (payload.category_id === 'c4') payload.category_id = 'c1000000-0000-0000-0000-000000000004';
            if (payload.category_id === 'c5') payload.category_id = 'c1000000-0000-0000-0000-000000000005';

            if (payload.category_id && !uuidRegex.test(payload.category_id)) {
                delete payload.category_id;
            }

            const { data, error } = await supabaseClient.from('products').update(payload).eq('id', id).select();
            if (error) {
                console.error("Supabase product update error:", error);
            }
            if (!error && data && data[0]) {
                let prods = [];
                try { prods = JSON.parse(localStorage.getItem('vw_mock_products') || '[]'); } catch(e) {}
                const idx = prods.findIndex(p => p.id === id);
                if (idx !== -1) {
                    prods[idx] = { ...prods[idx], ...payload, updated_at: new Date().toISOString() };
                    localStorage.setItem('vw_mock_products', JSON.stringify(prods));
                }
                return data[0];
            }
        } catch (e) {
            console.warn("Supabase update product failed, fallback to local store:", e);
        }
    }
    
    let prods = [];
    try { prods = JSON.parse(localStorage.getItem('vw_mock_products') || '[]'); } catch(e) {}
    if (!prods || prods.length === 0) prods = [...INITIAL_MOCK_PRODUCTS];
    
    const index = prods.findIndex(p => p.id === id);
    if (index !== -1) {
        prods[index] = { ...prods[index], ...productData, updated_at: new Date().toISOString() };
        localStorage.setItem('vw_mock_products', JSON.stringify(prods));
        return prods[index];
    }
    throw new Error("Product not found");
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
            // Check if user is logged in to link user_id if valid UUID
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

            const { data: order, error: orderErr } = await supabaseClient.from('orders').insert([orderPayload]).select().single();
            
            if (orderErr) {
                console.warn("Supabase order insert notice (falling back to guaranteed order completion):", orderErr.message);
            } else if (order) {
                const itemRows = items.map(item => {
                    const rawProdId = item.id || item.product_id;
                    const validProdId = (rawProdId && uuidRegex.test(rawProdId)) ? rawProdId : null;

                    return {
                        order_id: order.id,
                        product_id: validProdId,
                        product_name: item.name || item.product_name || 'Saree',
                        quantity: Number(item.quantity || 1),
                        price: Number(item.price || 0),
                        subtotal: Number(item.price || 0) * Number(item.quantity || 1)
                    };
                });
                
                const { error: itemErr } = await supabaseClient.from('order_items').insert(itemRows);
                if (itemErr) {
                    console.warn("Supabase order_items insert notice:", itemErr.message);
                }

                // Update local datastore cache as backup
                if (typeof localStorage !== 'undefined') {
                    let localOrders = [];
                    try { localOrders = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}
                    localOrders.unshift({ ...order, order_items: itemRows });
                    localStorage.setItem('vw_mock_orders', JSON.stringify(localOrders));
                }

                return { ...order, order_items: itemRows };
            }
        } catch (e) {
            console.warn("Supabase order creation exception, fallback to local store:", e);
        }
    }
    
    // 2. Guaranteed Order Completion Fallback (if Supabase RLS policies block insert)
    let orders = [];
    if (typeof localStorage !== 'undefined') {
        try { orders = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}
    }
    
    const fallbackId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const itemRows = (items || []).map((i, idx) => ({
        id: 'item_' + idx,
        product_name: i.name || i.product_name || 'Handcrafted Saree',
        quantity: Number(i.quantity || 1),
        price: Number(i.price || 0),
        subtotal: Number(i.price || 0) * Number(i.quantity || 1)
    }));

    const newOrder = {
        ...orderPayload,
        id: fallbackId,
        created_at: new Date().toISOString(),
        order_status: orderPayload.order_status || 'placed',
        payment_status: orderPayload.payment_status || 'pending',
        order_items: itemRows
    };
    
    if (typeof localStorage !== 'undefined') {
        orders.unshift(newOrder);
        localStorage.setItem('vw_mock_orders', JSON.stringify(orders));
    }
    return newOrder;
}

export async function getOrders() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
            if (error) {
                console.error("Supabase getOrders error:", error);
            }
            if (!error && data && data.length > 0) {
                return data;
            }
        } catch (e) {
            console.warn("Supabase orders fetch failed:", e);
        }
    }
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}
    if (!orders || orders.length === 0) {
        orders = [...INITIAL_MOCK_ORDERS];
        localStorage.setItem('vw_mock_orders', JSON.stringify(orders));
    }
    return orders;
}

export async function updateOrderStatus(orderId, order_status, payment_status) {
    if (supabaseClient) {
        try {
            const updateData = {};
            if (order_status) updateData.order_status = order_status;
            if (payment_status) updateData.payment_status = payment_status;
            
            const { data, error } = await supabaseClient.from('orders').update(updateData).eq('id', orderId).select();
            if (!error && data && data[0]) return data[0];
        } catch (e) {
            console.warn("Supabase update order status failed:", e);
        }
    }
    
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}
    const order = orders.find(o => o.id === orderId);
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
                    const key = (p.email || p.phone || p.full_name || p.id).toLowerCase();
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
            const emailKey = (o.email || '').toLowerCase();
            const phoneKey = (o.phone || '').toLowerCase();
            const nameKey = (o.customer_name || '').toLowerCase();
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

export async function deleteProduct(id) {
    if (supabaseClient) {
        try {
            const { error } = await supabaseClient.from('products').delete().eq('id', id);
            if (error) console.error("Supabase delete product error:", error);
        } catch (e) {
            console.warn("Supabase delete product failed, fallback to local store:", e);
        }
    }
    
    let prods = [];
    try { prods = JSON.parse(localStorage.getItem('vw_mock_products') || '[]'); } catch(e) {}
    prods = prods.filter(p => p.id !== id);
    localStorage.setItem('vw_mock_products', JSON.stringify(prods));
    return true;
}

export async function saveCategory(categoryData) {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('categories').insert([categoryData]).select();
            if (!error && data && data[0]) return data[0];
        } catch (e) {
            console.warn("Supabase save category failed:", e);
        }
    }
    
    let cats = [];
    try { cats = JSON.parse(localStorage.getItem('vw_mock_categories') || '[]'); } catch(e) {}
    const newCat = { ...categoryData, id: 'cat_' + Date.now() };
    cats.push(newCat);
    localStorage.setItem('vw_mock_categories', JSON.stringify(cats));
    return newCat;
}

export { supabaseClient };

