// ==============================================================================
// VANAMALA WEAVES - SUPABASE ENVIRONMENT CONFIGURATION
// ==============================================================================
// Replace these with your project's publishable credentials from Supabase Dashboard:
// Project Settings -> API -> Project URL & Project API Key (anon/public key)

export const SUPABASE_URL = "https://kuajhwywwvjykxjaaxkg.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YWpod3l3d3ZqeWt4amFheGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODgzNDEsImV4cCI6MjEwMjM2NDM0MX0.hnjYcD2mfUuKzTp9ciLw5FfPp4xLj4p9RmScTgdE12k";

// Indicates if live credentials have been configured
export const isSupabaseConfigured = () => {
    return SUPABASE_URL && 
           !SUPABASE_URL.includes("YOUR_SUPABASE_PROJECT_ID") && 
           SUPABASE_ANON_KEY && 
           !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_PUBLISHABLE_KEY");
};
