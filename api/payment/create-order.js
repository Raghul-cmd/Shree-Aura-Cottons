const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');

// Helper to initialize Supabase server client
function getSupabaseClient() {
    const url = process.env.SUPABASE_URL || "https://kuajhwywwvjykxjaaxkg.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YWpod3l3d3ZqeWt4amFheGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODgzNDEsImV4cCI6MjEwMjM2NDM0MX0.hnjYcD2mfUuKzTp9ciLw5FfPp4xLj4p9RmScTgdE12k";
    return createClient(url, key);
}

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { items, shipping_address } = req.body || {};

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart items are required' });
        }

        if (!shipping_address || !shipping_address.fullName || !shipping_address.phone || !shipping_address.address) {
            return res.status(400).json({ success: false, error: 'Shipping details are incomplete' });
        }

        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpayKeyId || !razorpayKeySecret) {
            return res.status(500).json({ 
                success: false, 
                error: 'Razorpay API credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured in Vercel environment variables.' 
            });
        }

        const supabase = getSupabaseClient();

        // 1. Retrieve authoritative product prices from Supabase
        const productIds = items.map(i => i.product_id || i.id).filter(Boolean);
        let fetchedProducts = [];

        if (productIds.length > 0) {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .in('id', productIds);
            
            if (!error && data) {
                fetchedProducts = data;
            }
        }

        // 2. Server-side Total Calculation (Never trust client-side prices)
        let subtotal = 0;
        const processedItems = items.map(item => {
            const prodId = item.product_id || item.id;
            const dbProduct = fetchedProducts.find(p => p.id === prodId);

            const unitPrice = dbProduct ? Number(dbProduct.price) : Number(item.price || 0);
            const qty = Math.max(1, Number(item.quantity || 1));
            const itemSubtotal = unitPrice * qty;

            subtotal += itemSubtotal;

            return {
                product_id: prodId || null,
                product_name: (dbProduct ? dbProduct.name : item.name) || 'Handcrafted Saree',
                quantity: qty,
                price: unitPrice,
                subtotal: itemSubtotal
            };
        });

        // Calculate shipping: Free above ₹1,999, else ₹99
        const shipping = (subtotal >= 1999 || subtotal === 0) ? 0 : 99;
        const grandTotal = subtotal + shipping;
        const amountInPaise = Math.round(grandTotal * 100); // Razorpay requires amount in paise

        // 3. Initialize Razorpay SDK & Create Razorpay Order
        const rzp = new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret
        });

        const receiptId = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const razorpayOrder = await rzp.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId,
            notes: {
                customer_name: shipping_address.fullName,
                customer_phone: shipping_address.phone
            }
        });

        // 4. Create pending order in Supabase
        const orderPayload = {
            customer_name: shipping_address.fullName,
            phone: shipping_address.phone,
            email: shipping_address.email || '',
            address: shipping_address.address,
            city: shipping_address.city || '',
            state: shipping_address.state || '',
            pincode: shipping_address.pincode || '',
            total_amount: grandTotal,
            payment_method: 'online',
            payment_status: 'pending',
            order_status: 'placed',
            razorpay_order_id: razorpayOrder.id
        };

        const { data: dbOrder, error: orderErr } = await supabase
            .from('orders')
            .insert([orderPayload])
            .select()
            .single();

        let createdOrderId = dbOrder ? dbOrder.id : 'ORD-' + Math.floor(100000 + Math.random() * 900000);

        if (dbOrder && createdOrderId) {
            const itemRows = processedItems.map(pi => ({
                order_id: dbOrder.id,
                product_id: pi.product_id,
                product_name: pi.product_name,
                quantity: pi.quantity,
                price: pi.price,
                subtotal: pi.subtotal
            }));

            await supabase.from('order_items').insert(itemRows);
        }

        return res.status(200).json({
            success: true,
            order_id: createdOrderId,
            razorpay_order_id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: razorpayKeyId,
            customer: {
                name: shipping_address.fullName,
                email: shipping_address.email,
                contact: shipping_address.phone
            }
        });

    } catch (err) {
        console.error("Razorpay order creation exception:", err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to create Razorpay order'
        });
    }
};
