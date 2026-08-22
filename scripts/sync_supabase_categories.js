import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../js/config.js';

const CATEGORIES = [
    { name: 'Wedding Sarees', slug: 'wedding-sarees', description: 'Opulent Kanchipuram & Banarasi bridal heirloom collections.', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/8.jpeg' },
    { name: 'Office Wear', slug: 'office-wear', description: 'Elegantly styled, comfortable handloom sarees engineered for professional wear.', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/7.jpeg' },
    { name: 'Daily Wear', slug: 'daily-wear', description: 'Lightweight, elegant, everyday sarees engineered for comfort.', image_url: 'https://kuajhwywwvjykxjaaxkg.supabase.co/storage/v1/object/public/product-images/sarees/4.jpeg' }
];

async function syncSupabaseCategories() {
    console.log("⏳ Syncing categories with Supabase REST API...");
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(CATEGORIES)
        });

        if (response.ok) {
            console.log("✅ Successfully synced 3 categories with Supabase Database!");
        } else {
            const err = await response.text();
            console.warn("⚠️ Supabase category sync response:", response.status, err);
        }
    } catch (err) {
        console.error("❌ Failed to sync categories with Supabase:", err);
    }
}

syncSupabaseCategories();
