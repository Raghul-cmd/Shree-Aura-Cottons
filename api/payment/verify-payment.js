const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

function getSupabaseClient() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
        throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be configured in environment variables.");
    }
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
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body || {};

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, error: 'Missing Razorpay signature verification parameters' });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return res.status(500).json({ success: false, error: 'RAZORPAY_KEY_SECRET is not configured on server' });
        }

        // 1. Verify Razorpay HMAC-SHA256 Signature
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        const isSignatureValid = generatedSignature === razorpay_signature;

        const supabase = getSupabaseClient();

        if (!isSignatureValid) {
            // Mark payment status as failed in database
            if (order_id || razorpay_order_id) {
                const matchCol = order_id ? 'id' : 'razorpay_order_id';
                const matchVal = order_id || razorpay_order_id;
                await supabase.from('orders').update({ payment_status: 'failed' }).eq(matchCol, matchVal);
            }
            return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
        }

        // 2. Signature Verified Successfully -> Update Supabase Order Status to 'paid'
        let targetId = order_id;
        if (targetId && !isNaN(Number(targetId))) {
            targetId = Number(targetId);
        }

        const updateData = {
            payment_status: 'paid',
            razorpay_payment_id: razorpay_payment_id
        };

        if (targetId) {
            await supabase.from('orders').update(updateData).eq('id', targetId);
        } else {
            await supabase.from('orders').update(updateData).eq('razorpay_order_id', razorpay_order_id);
        }

        // 3. Log Audit Record in payments table (if table exists)
        try {
            await supabase.from('payments').insert([{
                order_id: targetId || null,
                razorpay_order_id: razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id,
                status: 'captured',
                signature_verified: true
            }]);
        } catch(e) {
            // Ignore if payments table is not created yet
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            order_id: targetId || razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id
        });

    } catch (err) {
        console.error("Razorpay verification exception:", err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Payment verification exception'
        });
    }
};
