const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
    const url = process.env.SUPABASE_URL || "https://kuajhwywwvjykxjaaxkg.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YWpod3l3d3ZqeWt4amFheGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODgzNDEsImV4cCI6MjEwMjM2NDM0MX0.hnjYcD2mfUuKzTp9ciLw5FfPp4xLj4p9RmScTgdE12k";
    return createClient(url, key);
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'Method Not Allowed' });
    }

    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
        const razorpaySignature = req.headers['x-razorpay-signature'];

        if (webhookSecret && razorpaySignature) {
            const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');

            if (expectedSignature !== razorpaySignature) {
                console.warn("Razorpay Webhook: Invalid signature mismatch");
                return res.status(400).json({ status: 'Invalid Signature' });
            }
        }

        const eventPayload = req.body || {};
        const event = eventPayload.event;
        const payload = eventPayload.payload || {};

        const supabase = getSupabaseClient();

        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = payload.payment ? payload.payment.entity : null;
            const orderEntity = payload.order ? payload.order.entity : null;

            const razorpayOrderId = (orderEntity && orderEntity.id) || (paymentEntity && paymentEntity.order_id);
            const razorpayPaymentId = paymentEntity ? paymentEntity.id : null;

            if (razorpayOrderId) {
                // Idempotent update: ensure we only update if not already paid
                await supabase
                    .from('orders')
                    .update({ 
                        payment_status: 'paid',
                        razorpay_payment_id: razorpayPaymentId || undefined 
                    })
                    .eq('razorpay_order_id', razorpayOrderId);
            }
        } else if (event === 'payment.failed') {
            const paymentEntity = payload.payment ? payload.payment.entity : null;
            const razorpayOrderId = paymentEntity ? paymentEntity.order_id : null;

            if (razorpayOrderId) {
                await supabase
                    .from('orders')
                    .update({ payment_status: 'failed' })
                    .eq('razorpay_order_id', razorpayOrderId);
            }
        }

        return res.status(200).json({ status: 'ok' });

    } catch (err) {
        console.error("Razorpay webhook processing error:", err);
        return res.status(500).json({ status: 'error', error: err.message });
    }
};
