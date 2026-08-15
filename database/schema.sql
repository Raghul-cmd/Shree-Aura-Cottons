-- ==============================================================================
-- VANAMALA WEAVES / ROYAL SAREE COLLECTIONS - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in your Supabase SQL Editor to create tables, security rules,
-- triggers, indexes, and initial seed dataset.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES DEFINITIONS

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
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

-- PRODUCT IMAGES TABLE (Support multiple images per saree)
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER PROFILES TABLE (Tied to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WISHLIST TABLE
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
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
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- 3. INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_fabric ON public.products(fabric);
CREATE INDEX IF NOT EXISTS idx_products_color ON public.products(color);
CREATE INDEX IF NOT EXISTS idx_products_occasion ON public.products(occasion);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);

-- 4. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Customer'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if auth user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CATEGORIES POLICIES
CREATE POLICY "Categories read for all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories insert for admin" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Categories update for admin" ON public.categories FOR UPDATE USING (public.is_admin());
CREATE POLICY "Categories delete for admin" ON public.categories FOR DELETE USING (public.is_admin());

-- PRODUCTS POLICIES
CREATE POLICY "Active products read for all" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Products insert for admin" ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Products update for admin" ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "Products delete for admin" ON public.products FOR DELETE USING (public.is_admin());

-- PRODUCT IMAGES POLICIES
CREATE POLICY "Product images read for all" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Product images insert for admin" ON public.product_images FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Product images update for admin" ON public.product_images FOR UPDATE USING (public.is_admin());
CREATE POLICY "Product images delete for admin" ON public.product_images FOR DELETE USING (public.is_admin());

-- PROFILES POLICIES
CREATE POLICY "Profiles viewable by user and admin" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles updated by user and admin" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- WISHLIST POLICIES
CREATE POLICY "Wishlist viewable by owner" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Wishlist insertable by owner" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Wishlist deletable by owner" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- ORDERS & ORDER ITEMS POLICIES
CREATE POLICY "Orders viewable by owner or admin" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Orders insertable by public/customer" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders updateable by admin" ON public.orders FOR UPDATE USING (public.is_admin());

CREATE POLICY "Order items viewable by owner or admin" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND (user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Order items insertable by public/customer" ON public.order_items FOR INSERT WITH CHECK (true);

-- 6. INITIAL SEED DATA FOR QUICK START
INSERT INTO public.categories (id, name, slug, description, image_url) VALUES
('c1000000-0000-0000-0000-000000000001', 'Cotton Sarees', 'cotton-sarees', 'Breathable, soft, and daily-wear handcrafted cotton sarees.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'),
('c1000000-0000-0000-0000-000000000002', 'Silk Sarees', 'silk-sarees', 'Pure silk weaves with regal gold zari borders for grand occasions.', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80'),
('c1000000-0000-0000-0000-000000000003', 'Banarasi Sarees', 'banarasi-sarees', 'Varanasi legacy brocade sarees rich with intricate flora motifs.', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'),
('c1000000-0000-0000-0000-000000000004', 'Daily Wear', 'daily-wear', 'Lightweight, elegant, everyday sarees engineered for comfort.', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&q=80'),
('c1000000-0000-0000-0000-000000000005', 'Wedding Sarees', 'wedding-sarees', 'Opulent Kanchipuram and Banarasi bridal heirloom collections.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, category_id, price, compare_price, discount_percentage, fabric, color, occasion, stock, sku, main_image, is_active, is_featured) VALUES
('Fancy Cotton Maroon Daily Saree', 'fancy-cotton-maroon-daily-saree', 'Elegant maroon pure cotton saree featuring floral block prints and a contrasting beige zari border. Perfect for all-day office and daily comfort.', (SELECT id FROM public.categories WHERE slug = 'cotton-sarees'), 899.00, 1299.00, 30, 'Cotton', 'Maroon', 'Daily Wear', 15, 'SAR-COT-001', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', true, true),
('Royal Kanjivaram Soft Silk Saree', 'royal-kanjivaram-soft-silk-saree', 'Rich peacock blue soft silk saree with heavy gold brocade zari weave along the pallu and traditional temple border motifs.', (SELECT id FROM public.categories WHERE slug = 'silk-sarees'), 2499.00, 3999.00, 37, 'Silk', 'Blue', 'Wedding', 8, 'SAR-SLK-002', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', true, true),
('Handwoven Banarasi Zari Silk Saree', 'handwoven-banarasi-zari-silk-saree', 'Traditional crimson red Banarasi silk saree featuring antique silver brocade motifs and hand-finished tassels.', (SELECT id FROM public.categories WHERE slug = 'banarasi-sarees'), 3299.00, 4999.00, 34, 'Banarasi', 'Red', 'Wedding', 6, 'SAR-BAN-003', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', true, true),
('Contemporary Georgette Printed Saree', 'contemporary-georgette-printed-saree', 'Lightweight pastel green georgette saree accented with micro-sequin border work and smooth flowy drape.', (SELECT id FROM public.categories WHERE slug = 'daily-wear'), 1199.00, 1699.00, 29, 'Georgette', 'Green', 'Office Wear', 20, 'SAR-GEO-004', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80', true, false),
('Pure Linen Handloom Mustard Saree', 'pure-linen-handloom-mustard-saree', 'Breathable organic linen saree in bright mustard yellow with silver tissue pallu and unstitched blouse piece included.', (SELECT id FROM public.categories WHERE slug = 'cotton-sarees'), 1599.00, 2199.00, 27, 'Linen', 'Yellow', 'Daily Wear', 12, 'SAR-LIN-005', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', true, true),
('Chanderi Silk Cotton Olive Saree', 'chanderi-silk-cotton-olive-saree', 'Lustrous olive green Chanderi silk saree with hand-woven gold zari motifs and lightweight sheen.', (SELECT id FROM public.categories WHERE slug = 'silk-sarees'), 1899.00, 2599.00, 27, 'Silk', 'Green', 'Festive Celebration', 10, 'SAR-CHN-006', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', true, true),
('Tussar Silk Hand Block Printed Saree', 'tussar-silk-hand-block-printed-saree', 'Authentic terracotta orange Tussar silk saree featuring traditional Ajrakh hand block prints and raw silk texture.', (SELECT id FROM public.categories WHERE slug = 'silk-sarees'), 2199.00, 3199.00, 31, 'Soft Silk', 'Orange', 'Office Wear', 14, 'SAR-TUS-007', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', true, false),
('Kanjeevaram Bridal Ruby Red Saree', 'kanjeevaram-bridal-ruby-red-saree', 'Opulent ruby red Kanjeevaram pure silk saree with heavy gold brocade zari work across the body and pallu.', (SELECT id FROM public.categories WHERE slug = 'wedding-sarees'), 4599.00, 6999.00, 34, 'Silk', 'Red', 'Wedding', 5, 'SAR-KNJ-008', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', true, true),
('Organza Floral Pastel Pink Saree', 'organza-floral-pastel-pink-saree', 'Delicate pastel pink sheer organza saree with hand-painted digital floral prints and embroidered pearl scalloped border.', (SELECT id FROM public.categories WHERE slug = 'daily-wear'), 1499.00, 1999.00, 25, 'Georgette', 'Pink', 'Festive Celebration', 18, 'SAR-ORG-009', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80', true, true),
('Chettinad Cotton Temple Border Saree', 'chettinad-cotton-temple-border-saree', 'Authentic Chettinad handloom cotton saree in deep navy and mustard with traditional rudraksham temple zari border.', (SELECT id FROM public.categories WHERE slug = 'cotton-sarees'), 999.00, 1499.00, 33, 'Cotton', 'Blue', 'Daily Wear', 25, 'SAR-CHT-010', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', true, false)
ON CONFLICT (slug) DO NOTHING;
