// ==============================================================================
// VANAMALA WEAVES - SUPABASE CLIENT & MOCK DATABASE ENGINE
// ==============================================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './config.js';

let supabaseClient = null;

// Initialize official Supabase Client if CDN is loaded and keys are set
if (window.supabase && isSupabaseConfigured()) {
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
    { id: 'c1', name: 'Cotton Sarees', slug: 'cotton-sarees', description: 'Breathable handcrafted daily cotton sarees', image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80' },
    { id: 'c2', name: 'Silk Sarees', slug: 'silk-sarees', description: 'Pure silk weaves with regal gold zari borders', image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80' },
    { id: 'c3', name: 'Banarasi Sarees', slug: 'banarasi-sarees', description: 'Varanasi brocade heirloom sarees', image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80' },
    { id: 'c4', name: 'Daily Wear', slug: 'daily-wear', description: 'Lightweight everyday sarees', image_url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&q=80' },
    { id: 'c5', name: 'Wedding Sarees', slug: 'wedding-sarees', description: 'Opulent Kanchipuram & Banarasi bridal wear', image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80' }
];

const INITIAL_MOCK_PRODUCTS = [
    {
        id: 'p1',
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
        main_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'
        ],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: 'p2',
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
        main_image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
        ],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
        id: 'p3',
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
        main_image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
        ],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
        id: 'p4',
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
        main_image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80'
        ],
        is_active: true,
        is_featured: false,
        created_at: new Date(Date.now() - 86400000 * 6).toISOString()
    },
    {
        id: 'p5',
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
        main_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
        ],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
        id: 'p6',
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
        main_image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'
        ],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
        id: 'p7',
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
        main_image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
        ],
        is_active: true,
        is_featured: false,
        created_at: new Date(Date.now() - 86400000 * 7).toISOString()
    },
    {
        id: 'p8',
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
        main_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
        ],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 8).toISOString()
    },
    {
        id: 'p9',
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
        main_image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80'
        ],
        is_active: true,
        is_featured: true,
        created_at: new Date(Date.now() - 86400000 * 9).toISOString()
    },
    {
        id: 'p10',
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
        main_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
        ],
        is_active: true,
        is_featured: false,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString()
    }
];

// Helper to seed LocalStorage if mock mode
function initMockStorage() {
    const existing = localStorage.getItem('vw_mock_products');
    if (!existing || JSON.parse(existing).length < 10) {
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
    try {
        localProds = JSON.parse(localStorage.getItem('vw_mock_products') || '[]');
    } catch(e) {}
    if (!localProds || localProds.length < 10) {
        localProds = INITIAL_MOCK_PRODUCTS;
        localStorage.setItem('vw_mock_products', JSON.stringify(INITIAL_MOCK_PRODUCTS));
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
    try {
        localProds = JSON.parse(localStorage.getItem('vw_mock_products') || '[]');
    } catch(e) {}
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
    try {
        cats = JSON.parse(localStorage.getItem('vw_mock_categories') || '[]');
    } catch(e) {}
    if (!cats || cats.length === 0) {
        cats = INITIAL_MOCK_CATEGORIES;
        localStorage.setItem('vw_mock_categories', JSON.stringify(INITIAL_MOCK_CATEGORIES));
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
            const { data, error } = await supabaseClient.from('products').update(productData).eq('id', id).select();
            if (error) {
                console.error("Supabase product update error:", error);
            }
            if (!error && data && data[0]) {
                let prods = [];
                try { prods = JSON.parse(localStorage.getItem('vw_mock_products') || '[]'); } catch(e) {}
                const idx = prods.findIndex(p => p.id === id);
                if (idx !== -1) {
                    prods[idx] = { ...prods[idx], ...productData, updated_at: new Date().toISOString() };
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
    if (supabaseClient) {
        try {
            const { data: order, error: orderErr } = await supabaseClient.from('orders').insert([orderPayload]).select().single();
            if (!orderErr && order) {
                const itemRows = items.map(item => ({
                    order_id: order.id,
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                }));
                await supabaseClient.from('order_items').insert(itemRows);
                return order;
            }
        } catch (e) {
            console.warn("Supabase order creation failed, fallback to local store:", e);
        }
    }
    
    // Mock order creation
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}
    const newOrder = {
        ...orderPayload,
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        created_at: new Date().toISOString(),
        order_status: 'placed',
        payment_status: 'pending',
        items: items
    };
    orders.unshift(newOrder);
    localStorage.setItem('vw_mock_orders', JSON.stringify(orders));
    return newOrder;
}

export async function getOrders() {
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
            if (!error && data) return data;
        } catch (e) {
            console.warn("Supabase orders fetch failed:", e);
        }
    }
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('vw_mock_orders') || '[]'); } catch(e) {}
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

export { supabaseClient };
