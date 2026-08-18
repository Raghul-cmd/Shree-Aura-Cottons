# 🛍️ Shree Aura Cottons - Production Saree E-Commerce Store & Mobile PWA App

A full-featured, luxury Indian saree e-commerce website and mobile application built with **HTML5, Vanilla CSS3, ES Module JavaScript, PWA Service Worker, Supabase PostgreSQL, Supabase Auth, and Supabase Storage**.

---

## ✨ Features

### Customer Storefront
- **Mega Menu Navigation**: Shop All, Sarees by Fabric (Cotton, Silk, Banarasi, Georgette, Linen), Shop by Occasion (Daily Wear, Office Wear, Wedding), New Arrivals.
- **Kalamandir-Inspired Collection Page (`shop.html`)**:
  - Live debounced search against product title, SKU, fabric, color, and category.
  - Multi-select filters (Category, Fabric, Color, Occasion, Price Ranges).
  - Sorting (Featured, Price Low → High, Price High → Low, Alphabetical A-Z/Z-A, Newest).
  - Dynamic active filter tag pills with single-click removal.
  - Product Card featuring discount tag (`-30%`), wishlist heart toggle, sale price in maroon, compare price crossed out, and quick "ADD TO CART" button.
- **Product Details Page (`product.html`)**:
  - Interactive multi-image thumbnail gallery & viewer.
  - Stock availability pill (`In Stock` / `Out of Stock`).
  - Saree specs breakdown (Fabric, Color, Occasion, Length: 6.3m with blouse piece, Care instructions).
  - Quantity counter `[-] 1 [+]` with boundary checks.
  - Instant Add to Cart, Buy Now direct checkout, and related saree recommendations.
- **Cart & Wishlist**:
  - LocalStorage & Supabase sync cart with automatic free shipping threshold calculation (Free over ₹1,999).
  - Promo discount coupon input (Apply `ROYAL10` for 10% off).
  - Saved Wishlist page (`wishlist.html`) with quick move-to-cart functionality.
- **Checkout (`checkout.html`)**:
  - Delivery address collection & pincode validation.
  - Payment method picker (Cash on Delivery / UPI Pay QR simulation).
  - Order submission to Supabase `orders` & `order_items` tables with order confirmation reference ID.

---

## 🗄️ Supabase Setup Instructions

### Step 1: Run SQL Schema
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New Query**.
3. Copy the contents of `database/schema.sql` and click **Run**.
4. This creates tables (`categories`, `products`, `product_images`, `profiles`, `wishlist`, `orders`, `order_items`), indexes, RLS policies, auto profile creation triggers, and seeds 5 initial sarees.

### Step 2: Configure Storage Bucket
1. In Supabase Dashboard, go to **Storage** -> **Create New Bucket**.
2. Name the bucket `product-images`.
3. Set the bucket to **Public** so product images can be viewed by customers.

### Step 3: Set Credentials in `js/config.js`
Open `js/config.js` and paste your project's publishable credentials:
```javascript
export const SUPABASE_URL = "https://your-project-id.supabase.co";
export const SUPABASE_ANON_KEY = "your-publishable-anon-key";
```

*(Note: If left unconfigured, the application automatically runs in **Mock Fallback Mode** with working in-memory local data so you can test all features immediately in any browser!)*

---

## 🚀 GitHub & Vercel Deployment

### Deploying via GitHub & Vercel
1. Initialize git and commit:
```bash
git init
git add .
git commit -m "Initial release of Vanamala Weaves Saree E-Commerce website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/saree-store.git
git push -u origin main
```

2. Connect to Vercel:
- Go to [Vercel Dashboard](https://vercel.com) -> **Add New Project**.
- Select your `saree-store` GitHub repository.
- Under **Environment Variables**, add:
  - `SUPABASE_URL` = `https://your-project-id.supabase.co`
  - `SUPABASE_ANON_KEY` = `your-publishable-anon-key`
- Click **Deploy**.

---

&copy; 2026 Vanamala Weaves. All rights reserved.
