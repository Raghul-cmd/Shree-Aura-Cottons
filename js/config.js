// ==============================================================================
// VANAMALA WEAVES - SUPABASE ENVIRONMENT CONFIGURATION
// ==============================================================================
// Replace these with your project's publishable credentials from Supabase Dashboard:
// Project Settings -> API -> Project URL & Project API Key (anon/public key)

export const SUPABASE_URL = "https://YOUR_SUPABASE_PROJECT_ID.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

// Indicates if live credentials have been configured
export const isSupabaseConfigured = () => {
    return SUPABASE_URL && 
           !SUPABASE_URL.includes("YOUR_SUPABASE_PROJECT_ID") && 
           SUPABASE_ANON_KEY && 
           !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_PUBLISHABLE_KEY");
};
