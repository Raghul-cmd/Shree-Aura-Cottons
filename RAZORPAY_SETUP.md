# Razorpay Online Payment Integration Setup Guide

This guide explains how to configure and deploy the secure Razorpay online payment integration for **Shree Aura Cottons**.

---

## 1. Razorpay Account & Test Key Setup

1. Sign in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Account & Settings** -> **API Keys**.
3. Ensure you are in **Test Mode** (toggle at top right of Razorpay dashboard).
4. Click **Generate Test Key**.
5. Copy your **Key ID** (`rzp_test_...`) and **Key Secret**.

---

## 2. Supabase Database Configuration

Run the following SQL snippet in your **Supabase SQL Editor** (`SQL Editor` -> `New Query` -> `Run`):

```sql
-- 1. Add Razorpay tracking columns to public.orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);

-- 2. Create audit table for payment verification logs
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'captured',
    signature_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes & Public Grants
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.payments TO anon, authenticated, service_role;
```

---

## 3. Vercel Environment Variables Configuration

In your **Vercel Project Dashboard**:
1. Go to **Settings** -> **Environment Variables**.
2. Add the following environment variables:

| Variable Name | Description | Example Value |
|---|---|---|
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_XXXXXXXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `XXXXXXXXXXXXXXXXXXXXXXXX` |
| `RAZORPAY_WEBHOOK_SECRET` | Optional Webhook Secret | `my_webhook_secret_key` |
| `SUPABASE_URL` | Supabase Project URL | `https://kuajhwywwvjykxjaaxkg.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhbGciOi...` |

> **Security Note:** Never commit `RAZORPAY_KEY_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` to public repositories.

---

## 4. Razorpay Webhook Configuration

1. In Razorpay Dashboard, go to **Settings** -> **Webhooks**.
2. Click **Add New Webhook**.
3. Set **Webhook URL** to your live Vercel endpoint:
   `https://shree-aura-cottons.vercel.app/api/payment/webhook`
4. Set **Secret** (matching `RAZORPAY_WEBHOOK_SECRET` in Vercel environment variables).
5. Select Active Events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Click **Save Webhook**.

---

## 5. End-to-End Testing Procedure

1. Visit your live site (`https://shree-aura-cottons.vercel.app/shop.html`).
2. Add a Saree to cart and proceed to Checkout (`checkout.html`).
3. Fill in customer delivery details.
4. Select **Online Payment (UPI, Cards, NetBanking, QR Code) - Fast digital pay via Razorpay**.
5. Click **PLACE ORDER NOW**.
6. The Razorpay modal popup will open:
   - Select **Netbanking** (e.g., SBI / HDFC Test Bank).
   - Click **Success**.
7. Verification will automatically process server-side, the order success modal will appear with Order Reference ID, and cart will be cleared.
8. Check Admin Portal (`admin.html`) to verify order status is `placed`, payment status is `paid`, and `Razorpay Payment ID` is displayed.

---

## 6. Switching from Test Mode to Live Mode

When ready to accept live payments from customers:
1. In Razorpay Dashboard, complete **KYC Verification** and switch to **Live Mode**.
2. Go to **Account & Settings** -> **API Keys** and click **Generate Live Key**.
3. Update environment variables in **Vercel Settings**:
   - `RAZORPAY_KEY_ID`: `rzp_live_...`
   - `RAZORPAY_KEY_SECRET`: Live secret key
4. Update Webhook URL in Live Razorpay Dashboard.
5. Redeploy project on Vercel (`git push origin main`).

---

## 7. Security Checklist

- [x] All price calculations performed server-side (never trusting frontend prices).
- [x] HMAC-SHA256 signature verification performed on backend Vercel serverless function (`verify-payment.js`).
- [x] Webhook signatures verified server-side using secret.
- [x] Sensitive secret keys (`RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) excluded from client-side bundle and protected by `.gitignore`.
- [x] Webhook handler designed to be idempotent (prevents double updates).
