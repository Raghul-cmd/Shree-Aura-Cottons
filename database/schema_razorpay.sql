-- ==============================================================================
-- SHREE AURA COTTONS - RAZORPAY INTEGRATION SUPABASE SCHEMA ADDITIONS
-- ==============================================================================
-- Run this script in your Supabase SQL Editor (SQL Editor -> New Query -> Run)

-- 1. ADD RAZORPAY COLUMNS TO ORDERS TABLE
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);

-- 2. CREATE PAYMENTS AUDIT TABLE (WITH UNIQUE CONSTRAINT ON razorpay_payment_id)
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'captured',
    signature_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PERMISSIONS & INDEXES FOR PAYMENTS TABLE
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.payments TO anon, authenticated, service_role;
