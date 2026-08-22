const SUPABASE_URL = "https://kuajhwywwvjykxjaaxkg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YWpod3l3d3ZqeWt4amFheGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODgzNDEsImV4cCI6MjEwMjM2NDM0MX0.hnjYcD2mfUuKzTp9ciLw5FfPp4xLj4p9RmScTgdE12k";

async function clearAllOrders() {
    console.log("Clearing all test orders from Supabase via REST API...");

    // 1. Delete order_items
    const resItems = await fetch(`${SUPABASE_URL}/rest/v1/order_items?id=gt.0`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    console.log("order_items DELETE status:", resItems.status);

    // 2. Delete orders
    const resOrders = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=gt.0`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    console.log("orders DELETE status:", resOrders.status);

    console.log("✅ All test orders cleared from Supabase Database!");
}

clearAllOrders();
