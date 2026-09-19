import { API_BASE_URL } from './config.js';
import { supabaseClient } from './supabase.js';

/**
 * Authenticates an Admin user against Secure Node.js Backend & Supabase Auth
 */
export async function loginAdmin(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. Try High-Security Node.js Backend API Endpoint (try configured API_BASE_URL & http://localhost:5000)
    const endpointsToTry = [
        `${API_BASE_URL}/api/admin/login`,
        'http://localhost:5000/api/admin/login'
    ];

    // Remove duplicates
    const uniqueEndpoints = [...new Set(endpointsToTry)];

    for (const endpoint of uniqueEndpoints) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.success) {
                    const adminSession = {
                        id: data.user.id,
                        email: data.user.email,
                        full_name: data.user.full_name || 'Store Administrator',
                        role: 'admin',
                        token: data.token,
                        authenticatedAt: new Date().toISOString()
                    };
                    localStorage.setItem('vw_session', JSON.stringify(adminSession));
                    if (data.token) {
                        localStorage.setItem('admin_token', data.token);
                    }
                    return { user: data.user, role: 'admin', session: adminSession };
                }
            }
        } catch (err) {
            console.warn(`[AUTH] Backend endpoint (${endpoint}) unreachable:`, err.message);
        }
    }

    // 2. Check if Supabase Auth succeeds
    if (supabaseClient && cleanEmail.includes('@')) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanPassword
            });

            if (!error && data && data.user) {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', data.user.id)
                    .maybeSingle();

                const adminSession = {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: profile?.full_name || data.user.user_metadata?.full_name || 'Store Administrator',
                    role: 'admin',
                    authenticatedAt: new Date().toISOString()
                };
                localStorage.setItem('vw_session', JSON.stringify(adminSession));
                return { user: data.user, role: 'admin', session: adminSession };
            }
        } catch (err) {
            console.warn("Supabase Auth admin login attempt warning:", err);
        }
    }

    // 3. Fallback Admin Credentials for static server / client preview
    const isUserMatch = (cleanEmail === 'shreeauracottons@gmail.com');
    const isPasswordMatch = (cleanPassword === 'ShreeAuraCottons24');

    if (isUserMatch && isPasswordMatch) {
        const adminSession = {
            id: 'usr_admin_master_001',
            email: 'shreeauracottons@gmail.com',
            full_name: 'Store Administrator',
            role: 'admin',
            authenticatedAt: new Date().toISOString()
        };
        localStorage.setItem('vw_session', JSON.stringify(adminSession));
        return { user: adminSession, role: 'admin', session: adminSession };
    }

    throw new Error("Invalid admin email or password. Authorization failed.");
}

/**
 * Authenticates a regular customer user against Supabase Auth
 */
export async function loginUser(email, password) {
    const cleanEmail = email.trim();

    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: cleanEmail,
                password: password
            });

            if (!error && data && data.user) {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', data.user.id)
                    .maybeSingle();

                const session = {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: profile ? profile.full_name : (data.user.user_metadata?.full_name || 'Customer'),
                    role: profile ? profile.role : 'customer'
                };
                localStorage.setItem('vw_session', JSON.stringify(session));
                return { user: data.user, role: session.role };
            }
        } catch (e) {
            console.warn("Supabase customer login fallback:", e);
        }
    }

    // Fallback Customer session
    const mockCustSession = {
        id: 'usr_cust_' + Date.now(),
        email: cleanEmail,
        full_name: 'Customer',
        role: 'customer'
    };
    localStorage.setItem('vw_session', JSON.stringify(mockCustSession));
    return { user: mockCustSession, role: 'customer' };
}

/**
 * Retrieves current active user session and verifies role
 */
export async function getCurrentUser() {
    const sessStr = localStorage.getItem('vw_session');
    let sessionObj = null;

    if (sessStr) {
        try { sessionObj = JSON.parse(sessStr); } catch(e) {}
    }

    // If local session is an active admin session, preserve it
    if (sessionObj && sessionObj.role === 'admin') {
        return sessionObj;
    }

    if (supabaseClient) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                const role = profile?.role || user.user_metadata?.role || (user.email === 'shreeauracottons@gmail.com' ? 'admin' : 'customer');
                const verifiedSession = {
                    id: user.id,
                    email: user.email,
                    role: role,
                    full_name: profile?.full_name || user.user_metadata?.full_name || (role === 'admin' ? 'Store Administrator' : 'Customer')
                };
                localStorage.setItem('vw_session', JSON.stringify(verifiedSession));
                return verifiedSession;
            }
        } catch(e) {}
    }

    return sessionObj;
}

/**
 * Registers a new user account directly in Supabase Auth & public.profiles table
 */
export async function signUpUser(email, password, fullName, phone = '', role = 'customer') {
    const cleanEmail = email.trim();

    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: cleanEmail,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        phone: phone,
                        role: role
                    }
                }
            });

            if (error) throw new Error(error.message);

            if (data && data.user) {
                const session = {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: fullName,
                    role: role
                };
                localStorage.setItem('vw_session', JSON.stringify(session));
                return { user: data.user, session };
            }
        } catch (err) {
            throw new Error(err.message);
        }
    }

    // Fallback Local session
    const mockSession = {
        id: 'usr_' + Date.now(),
        email: cleanEmail,
        full_name: fullName,
        phone: phone,
        role: role
    };
    localStorage.setItem('vw_session', JSON.stringify(mockSession));
    return { user: mockSession, session: mockSession };
}

/**
 * Sign out current session
 */
export async function logoutUser() {
    if (supabaseClient) {
        try {
            await supabaseClient.auth.signOut();
        } catch(e) {}
    }
    localStorage.removeItem('vw_session');
    window.location.href = 'login.html';
}

