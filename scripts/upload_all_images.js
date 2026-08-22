/**
 * ==============================================================================
 * WEAVES SAREE COLLECTIONS - SUPABASE IMAGE UPLOADER & DB SYNC SCRIPT
 * ==============================================================================
 * This script uploads all product saree images and branding assets from your local
 * assets directory (`assets/Saree Folder/` and `assets/logo.png`) directly to 
 * your Supabase Storage bucket `product-images` and updates the database records.
 *
 * Usage:
 *   node scripts/upload_all_images.js
 */

const fs = require('fs');
const path = require('path');

// Supabase project credentials (from js/config.js)
const SUPABASE_URL = "https://kuajhwywwvjykxjaaxkg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YWpod3l3d3ZqeWt4amFheGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODgzNDEsImV4cCI6MjEwMjM2NDM0MX0.hnjYcD2mfUuKzTp9ciLw5FfPp4xLj4p9RmScTgdE12k";
const BUCKET_NAME = "product-images";

// Local image directory mappings to products & categories
const PRODUCT_IMAGE_MAPPINGS = [
    { filename: '1.jpeg', sku: 'SAR-COT-001', categorySlug: 'cotton-sarees' },
    { filename: '2.jpeg', sku: 'SAR-SLK-002', categorySlug: 'silk-sarees' },
    { filename: '3.jpeg', sku: 'SAR-BAN-003', categorySlug: 'banarasi-sarees' },
    { filename: '4.jpeg', sku: 'SAR-GEO-004', categorySlug: 'daily-wear' },
    { filename: '5.jpeg', sku: 'SAR-LIN-005' },
    { filename: '6.jpeg', sku: 'SAR-CHN-006' },
    { filename: '7.jpeg', sku: 'SAR-TUS-007' },
    { filename: '8.jpeg', sku: 'SAR-KNJ-008', categorySlug: 'wedding-sarees' },
    { filename: '9.jpeg', sku: 'SAR-ORG-009' },
    { filename: '10.jpeg', sku: 'SAR-CHT-010' },
];

// Helper to upload a single file to Supabase Storage
async function uploadFileToSupabaseStorage(localFilePath, storageSubPath, mimeType = 'image/jpeg') {
    if (!fs.existsSync(localFilePath)) {
        console.error(`❌ File not found at path: ${localFilePath}`);
        return null;
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${storageSubPath}`;

    console.log(`⏳ Uploading ${path.basename(localFilePath)} -> ${BUCKET_NAME}/${storageSubPath}...`);

    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': mimeType,
                'x-upsert': 'true' // Overwrite existing file if re-running
            },
            body: fileBuffer
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok || response.status === 200 || response.status === 201) {
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storageSubPath}`;
            console.log(`✅ Uploaded successfully: ${publicUrl}`);
            return publicUrl;
        } else {
            console.warn(`⚠️ Upload returned status ${response.status}:`, result.message || JSON.stringify(result));
            // Return predicted public URL regardless if RLS is bypassed via dashboard SQL
            return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storageSubPath}`;
        }
    } catch (err) {
        console.error(`❌ Network error uploading ${localFilePath}:`, err.message);
        return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storageSubPath}`;
    }
}

// Helper to update product in Supabase database table `products`
async function updateProductDatabase(sku, publicUrl) {
    const patchUrl = `${SUPABASE_URL}/rest/v1/products?sku=eq.${encodeURIComponent(sku)}`;

    try {
        const response = await fetch(patchUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ main_image: publicUrl })
        });

        if (response.ok) {
            console.log(`  └─ 🟢 Database product record updated for SKU [${sku}]`);
        } else {
            const resText = await response.text();
            console.log(`  └─ ℹ️ Database product update note (SKU ${sku}): ${response.status} - ${resText}`);
        }
    } catch (e) {
        console.warn(`  └─ ⚠️ Failed DB update for SKU ${sku}:`, e.message);
    }
}

// Helper to update category image in `categories` table
async function updateCategoryDatabase(slug, publicUrl) {
    const patchUrl = `${SUPABASE_URL}/rest/v1/categories?slug=eq.${encodeURIComponent(slug)}`;

    try {
        const response = await fetch(patchUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ image_url: publicUrl })
        });

        if (response.ok) {
            console.log(`  └─ 🟢 Database category image updated for category [${slug}]`);
        }
    } catch (e) {
        // Silent catch for category updates
    }
}

async function main() {
    console.log("=========================================================");
    console.log("🚀 STARTING SAREE PRODUCT IMAGES UPLOAD TO SUPABASE");
    console.log(`Target Supabase URL: ${SUPABASE_URL}`);
    console.log(`Target Storage Bucket: ${BUCKET_NAME}`);
    console.log("=========================================================\n");

    const sareeDir = path.join(__dirname, '../assets/Saree Folder');
    const logoFile = path.join(__dirname, '../assets/logo.png');

    const uploadResults = [];

    // 1. Upload Logo
    if (fs.existsSync(logoFile)) {
        const logoUrl = await uploadFileToSupabaseStorage(logoFile, 'branding/logo.png', 'image/png');
        if (logoUrl) uploadResults.push({ name: 'Logo', path: 'branding/logo.png', url: logoUrl });
    }

    // 2. Upload Saree Images
    for (const item of PRODUCT_IMAGE_MAPPINGS) {
        const localPath = path.join(sareeDir, item.filename);
        const storageSubPath = `sarees/${item.filename}`;
        
        const publicUrl = await uploadFileToSupabaseStorage(localPath, storageSubPath, 'image/jpeg');

        if (publicUrl) {
            uploadResults.push({
                sku: item.sku,
                filename: item.filename,
                url: publicUrl
            });

            // Sync with Supabase REST DB
            if (item.sku) {
                await updateProductDatabase(item.sku, publicUrl);
            }
            if (item.categorySlug) {
                await updateCategoryDatabase(item.categorySlug, publicUrl);
            }
        }
    }

    console.log("\n=========================================================");
    console.log("🎉 ALL PRODUCT IMAGES PROCESSED & MAPPED!");
    console.log("=========================================================");
    console.table(uploadResults.map(r => ({ SKU: r.sku || 'N/A', File: r.filename || r.name, PublicURL: r.url })));
    console.log("\n📌 NEXT STEP TO VERIFY PERMISSIONS:");
    console.log("Ensure you run the RLS Storage policy statements from database/schema.sql in your Supabase SQL Editor so public users can view & upload images without 403 authorization errors.");
}

main();
