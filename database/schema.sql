-- ==============================================================================
-- SHREE AURA COTTONS - COMPLETE OFFICIAL SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this complete script in Supabase SQL Editor (SQL Editor -> New Query -> Run)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP PREVIOUS TABLES (Clean slate)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. TABLES DEFINITIONS

-- CATEGORIES TABLE
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS TABLE
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    discount_percentage INT DEFAULT 0,
    fabric VARCHAR(100),
    color VARCHAR(100),
    occasion VARCHAR(100),
    stock INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE NOT NULL,
    main_image TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCT IMAGES GALLERY TABLE
CREATE TABLE public.product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WISHLIST TABLE
CREATE TABLE public.wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ORDERS TABLE
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    order_status VARCHAR(50) DEFAULT 'placed' CHECK (order_status IN ('placed', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDER ITEMS TABLE
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_fabric ON public.products(fabric);
CREATE INDEX idx_products_color ON public.products(color);
CREATE INDEX idx_products_occasion ON public.products(occasion);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_wishlist_user ON public.wishlist(user_id);

-- 5. PROFILE TRIGGER ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Customer'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. PERMISSIONS & ACCESS CONTROL (Guarantees public order placement works)
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.categories TO anon, authenticated, service_role;
GRANT ALL ON public.products TO anon, authenticated, service_role;
GRANT ALL ON public.product_images TO anon, authenticated, service_role;
GRANT ALL ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.order_items TO anon, authenticated, service_role;
GRANT ALL ON public.wishlist TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Public Orders Insert" ON public.orders;
CREATE POLICY "Public Orders Insert" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Orders Select" ON public.orders;
CREATE POLICY "Public Orders Select" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Orders Update" ON public.orders;
CREATE POLICY "Public Orders Update" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Order Items Insert" ON public.order_items;
CREATE POLICY "Public Order Items Insert" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Order Items Select" ON public.order_items;
CREATE POLICY "Public Order Items Select" ON public.order_items FOR SELECT USING (true);

-- 7. SUPABASE STORAGE BUCKET CONFIGURATION FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access product-images" ON storage.objects;
CREATE POLICY "Public Access product-images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Insert product-images" ON storage.objects;
CREATE POLICY "Public Insert product-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Update product-images" ON storage.objects;
CREATE POLICY "Public Update product-images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images');

-- 8. PRODUCT & CATEGORY SEED DATASET WITH LIVE STORAGE CDN IMAGE URLS

INSERT INTO public.categories (name, slug, description, image_url) VALUES
('Cotton Sarees', 'cotton-sarees', 'Breathable, soft, and daily-wear handcrafted cotton sarees.', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/1.jpeg'),
('Silk Sarees', 'silk-sarees', 'Pure silk weaves with regal gold zari borders for grand occasions.', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/2.jpeg'),
('Banarasi Sarees', 'banarasi-sarees', 'Varanasi legacy brocade sarees rich with intricate flora motifs.', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/3.jpeg'),
('Daily Wear', 'daily-wear', 'Lightweight, elegant, everyday sarees engineered for comfort.', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/4.jpeg'),
('Wedding Sarees', 'wedding-sarees', 'Opulent Kanchipuram and Banarasi bridal heirloom collections.', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/8.jpeg')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, category_id, price, compare_price, discount_percentage, fabric, color, occasion, stock, sku, main_image, is_active, is_featured) VALUES
('Fancy Cotton Maroon Daily Saree', 'fancy-cotton-maroon-daily-saree', 'Elegant maroon pure cotton saree featuring floral block prints and a contrasting beige zari border. Perfect for all-day office and daily comfort.', (SELECT id FROM public.categories WHERE slug = 'cotton-sarees'), 899.00, 1299.00, 30, 'Cotton', 'Maroon', 'Daily Wear', 15, 'SAR-COT-001', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/1.jpeg', true, true),
('Royal Kanjivaram Soft Silk Saree', 'royal-kanjivaram-soft-silk-saree', 'Rich peacock blue soft silk saree with heavy gold brocade zari weave along the pallu and traditional temple border motifs.', (SELECT id FROM public.categories WHERE slug = 'silk-sarees'), 2499.00, 3999.00, 37, 'Silk', 'Blue', 'Wedding', 8, 'SAR-SLK-002', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/2.jpeg', true, true),
('Handwoven Banarasi Zari Silk Saree', 'handwoven-banarasi-zari-silk-saree', 'Traditional crimson red Banarasi silk saree featuring antique silver brocade motifs and hand-finished tassels.', (SELECT id FROM public.categories WHERE slug = 'banarasi-sarees'), 3299.00, 4999.00, 34, 'Banarasi', 'Red', 'Wedding', 6, 'SAR-BAN-003', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/3.jpeg', true, true),
('Contemporary Georgette Printed Saree', 'contemporary-georgette-printed-saree', 'Lightweight pastel green georgette saree accented with micro-sequin border work and smooth flowy drape.', (SELECT id FROM public.categories WHERE slug = 'daily-wear'), 1199.00, 1699.00, 29, 'Georgette', 'Green', 'Office Wear', 20, 'SAR-GEO-004', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/4.jpeg', true, false),
('Pure Linen Handloom Mustard Saree', 'pure-linen-handloom-mustard-saree', 'Breathable organic linen saree in bright mustard yellow with silver tissue pallu and unstitched blouse piece included.', (SELECT id FROM public.categories WHERE slug = 'cotton-sarees'), 1599.00, 2199.00, 27, 'Linen', 'Yellow', 'Daily Wear', 12, 'SAR-LIN-005', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/5.jpeg', true, true),
('Chanderi Silk Cotton Olive Saree', 'chanderi-silk-cotton-olive-saree', 'Lustrous olive green Chanderi silk saree with hand-woven gold zari motifs and lightweight sheen.', (SELECT id FROM public.categories WHERE slug = 'silk-sarees'), 1899.00, 2599.00, 27, 'Silk', 'Green', 'Festive Celebration', 10, 'SAR-CHN-006', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/6.jpeg', true, true),
('Tussar Silk Hand Block Printed Saree', 'tussar-silk-hand-block-printed-saree', 'Authentic terracotta orange Tussar silk saree featuring traditional Ajrakh hand block prints and raw silk texture.', (SELECT id FROM public.categories WHERE slug = 'silk-sarees'), 2199.00, 3199.00, 31, 'Soft Silk', 'Orange', 'Office Wear', 14, 'SAR-TUS-007', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/7.jpeg', true, false),
('Kanjeevaram Bridal Ruby Red Saree', 'kanjeevaram-bridal-ruby-red-saree', 'Opulent ruby red Kanjeevaram pure silk saree with heavy gold brocade zari work across the body and pallu.', (SELECT id FROM public.categories WHERE slug = 'wedding-sarees'), 4599.00, 6999.00, 34, 'Silk', 'Red', 'Wedding', 5, 'SAR-KNJ-008', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/8.jpeg', true, true),
('Organza Floral Pastel Pink Saree', 'organza-floral-pastel-pink-saree', 'Delicate pastel pink sheer organza saree with hand-painted digital floral prints and embroidered pearl scalloped border.', (SELECT id FROM public.categories WHERE slug = 'daily-wear'), 1499.00, 1999.00, 25, 'Georgette', 'Pink', 'Festive Celebration', 18, 'SAR-ORG-009', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/9.jpeg', true, true),
('Chettinad Cotton Temple Border Saree', 'chettinad-cotton-temple-border-saree', 'Authentic Chettinad handloom cotton saree in deep navy and mustard with traditional rudraksham temple zari border.', (SELECT id FROM public.categories WHERE slug = 'cotton-sarees'), 999.00, 1499.00, 33, 'Cotton', 'Blue', 'Daily Wear', 25, 'SAR-CHT-010', 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/10.jpeg', true, false)
ON CONFLICT (slug) DO UPDATE SET main_image = EXCLUDED.main_image;

-- POPULATE GALLERY IMAGES TABLE FOR PRODUCTS
INSERT INTO public.product_images (product_id, image_url, display_order)
SELECT id, main_image, 1 FROM public.products
ON CONFLICT DO NOTHING;
