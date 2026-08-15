// ==============================================================================
// WEAVES SAREE COLLECTIONS - AUTHENTICATION & ROLE PROTECTION MODULE
// ==============================================================================

import { supabaseClient } from './supabase.js';

export async function loginUser(email, password) {
    const isAdminCred = (email === 'admin@weavessareecollections.com' || email === 'admin@weavessaree.com' || email === 'admin@vanamala.com') && password === 'admin123';

    if (supabaseClient && !isAdminCred) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (!error && data && data.user) {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', data.user.id)
                    .single();
                    
                const session = {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: profile ? profile.full_name : 'Customer',
                    role: profile ? profile.role : 'customer'
                };
                localStorage.setItem('vw_session', JSON.stringify(session));
                return { user: data.user, role: session.role };
            }
        } catch (e) {
            console.warn("Supabase auth failed, fallback check:", e);
        }
    }
    
    // Default Admin & Customer Credential Session
    if (isAdminCred) {
        const mockAdminSession = {
            id: 'usr_admin_001',
            email: 'admin@weavessareecollections.com',
            full_name: 'Store Administrator',
            role: 'admin'
        };
        localStorage.setItem('vw_session', JSON.stringify(mockAdminSession));
        return { user: mockAdminSession, role: 'admin' };
    } else {
        const mockCustSession = {
            id: 'usr_cust_' + Date.now(),
            email: email,
            full_name: 'Customer',
            role: 'customer'
        };
        localStorage.setItem('vw_session', JSON.stringify(mockCustSession));
        return { user: mockCustSession, role: 'customer' };
    }
}

export async function getCurrentUser() {
    const sess = localStorage.getItem('vw_session');
    if (sess) {
        try { return JSON.parse(sess); } catch(e) {}
    }

    if (supabaseClient) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                    
                return { ...user, role: profile ? profile.role : 'customer', full_name: profile ? profile.full_name : '' };
            }
        } catch(e) {}
    }
    
    return null;
}

export async function logoutUser() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    localStorage.removeItem('vw_session');
    window.location.href = '/login.html';
}

export async function adminGuard() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
        console.warn("Unauthorized admin access attempt. Redirecting to login...");
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
}
