// ==============================================================================
// WEAVES SAREE COLLECTIONS - CHECKOUT & ORDER PLACEMENT CONTROLLER
// ==============================================================================

import { getCart, getCartTotals, clearCart } from './cart.js';
import { createOrder } from './supabase.js';
import { getCurrentUser, signUpUser, loginUser } from './auth.js';

let activeUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    const cart = getCart();
    
    if (cart.length === 0) {
        window.location.href = 'shop.html';
        return;
    }
    
    renderOrderSummary();

    // Check current logged-in user
    activeUser = await getCurrentUser();
    if (activeUser) {
        autoFillUserDetails(activeUser);
    }
    
    const checkoutForm = document.getElementById('checkoutForm');
    checkoutForm?.addEventListener('submit', handleCheckoutSubmit);
});

function autoFillUserDetails(user) {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    if (user.full_name && form.elements['fullName']) form.elements['fullName'].value = user.full_name;
    if (user.email && form.elements['email']) form.elements['email'].value = user.email;
    if (user.phone && form.elements['phone']) form.elements['phone'].value = user.phone;
}

function renderOrderSummary() {
    const cart = getCart();
    const totals = getCartTotals();
    
    const summaryItemsEl = document.getElementById('checkoutItemsSummary');
    if (summaryItemsEl) {
        summaryItemsEl.innerHTML = cart.map(item => `
            <div class="summary-row" style="align-items: center;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <img src="${item.image || item.main_image || 'assets/logo.png'}" alt="${item.name}" style="width:40px; height:50px; object-fit:cover; border-radius:4px;">
                    <div>
                        <h4 style="font-size:0.85rem; font-weight:600;">${item.name}</h4>
                        <span style="font-size:0.75rem; color:var(--text-muted);">Qty: ${item.quantity}</span>
                    </div>
                </div>
                <span style="font-weight:600; font-size:0.9rem;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
            </div>
        `).join('');
    }
    
    document.getElementById('checkoutSubtotal').textContent = `₹${totals.subtotal.toLocaleString('en-IN')}`;
    document.getElementById('checkoutShipping').textContent = totals.shipping === 0 ? 'FREE' : `₹${totals.shipping}`;
    document.getElementById('checkoutDiscount').textContent = `-₹${totals.discount.toLocaleString('en-IN')}`;
    document.getElementById('checkoutGrandTotal').textContent = `₹${totals.grandTotal.toLocaleString('en-IN')}`;
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    // Check if user is logged in
    activeUser = await getCurrentUser();

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const fullName = formData.get('fullName');
    const phone = formData.get('phone');

    // If user has no active account session, prompt Account Creation / Login Modal before finalizing order
    if (!activeUser) {
        showAccountRequiredModal(fullName, email, phone, () => executeOrderPlacement(formData));
        return;
    }

    executeOrderPlacement(formData);
}

async function executeOrderPlacement(formData) {
    const submitBtn = document.getElementById('placeOrderBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `Placing Order...`;
    }

    try {
        const cartItems = getCart();
        const mainProductName = cartItems.length === 1 
            ? (cartItems[0].name || cartItems[0].product_name || 'Handcrafted Cotton Saree')
            : cartItems.map(i => `${i.name || i.product_name || 'Saree'} (x${i.quantity || 1})`).join(', ');

        const mainImage = cartItems[0]?.image || cartItems[0]?.main_image || 'assets/category showcase/1.png';
        const totalQuantity = cartItems.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

        const orderPayload = {
            customer_name: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            pincode: formData.get('pincode'),
            total_amount: getCartTotals().grandTotal,
            payment_status: formData.get('paymentMethod') === 'cod' ? 'pending' : 'paid',
            order_status: 'placed',
            product_name: mainProductName,
            quantity: totalQuantity,
            image: mainImage
        };

        const createdOrder = await createOrder(orderPayload, cartItems);

        // Clear cart on success
        clearCart();

        // Show Success Modal with View Orders button
        showSuccessModal(createdOrder);

    } catch (err) {
        console.error("Failed to place order:", err);
        alert("Failed to place order. Please try again.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `PLACE ORDER NOW`;
        }
    }
}

function showAccountRequiredModal(defaultName, defaultEmail, defaultPhone, onAccountReadyCallback) {
    const modalId = 'checkoutAuthModal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const modalHTML = `
        <div id="${modalId}" style="position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(5px); z-index:2000; display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn 0.3s ease;">
            <div style="background:var(--bg-white); border-radius:var(--radius-lg); padding:2rem; max-width:480px; width:100%; box-shadow:var(--shadow-lg); border:2px solid var(--gold-accent); relative;">
                <div style="text-align:center; margin-bottom:1.25rem;">
                    <div style="font-size:2.5rem; margin-bottom:0.4rem;">👤🌸</div>
                    <h3 style="font-family:var(--font-heading); font-size:1.6rem; color:var(--primary-maroon); margin:0 0 0.4rem; font-weight:800;">Create Account to Order</h3>
                    <p style="color:var(--text-muted); font-size:0.85rem; margin:0; font-weight:500;">
                        To track your saree order details and delivery status, please create your account below:
                    </p>
                </div>

                <form id="modalSignUpForm" style="display:flex; flex-direction:column; gap:0.9rem;">
                    <div>
                        <label style="font-size:0.8rem; font-weight:700; display:block; margin-bottom:0.2rem;">Full Name *</label>
                        <input type="text" id="modalFullName" value="${defaultName || ''}" required style="width:100%; padding:0.6rem; border:2px solid var(--border-color); border-radius:6px; font-size:0.9rem;">
                    </div>
                    <div>
                        <label style="font-size:0.8rem; font-weight:700; display:block; margin-bottom:0.2rem;">Email Address *</label>
                        <input type="email" id="modalEmail" value="${defaultEmail || ''}" required style="width:100%; padding:0.6rem; border:2px solid var(--border-color); border-radius:6px; font-size:0.9rem;">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                        <div>
                            <label style="font-size:0.8rem; font-weight:700; display:block; margin-bottom:0.2rem;">Phone Number *</label>
                            <input type="tel" id="modalPhone" value="${defaultPhone || ''}" required pattern="[0-9]{10}" style="width:100%; padding:0.6rem; border:2px solid var(--border-color); border-radius:6px; font-size:0.9rem;">
                        </div>
                        <div>
                            <label style="font-size:0.8rem; font-weight:700; display:block; margin-bottom:0.2rem;">Password *</label>
                            <input type="password" id="modalPassword" placeholder="Min 6 chars" required minlength="6" style="width:100%; padding:0.6rem; border:2px solid var(--border-color); border-radius:6px; font-size:0.9rem;">
                        </div>
                    </div>

                    <button type="submit" id="modalAuthSubmitBtn" class="btn btn-primary" style="width:100%; margin-top:0.5rem; padding:0.75rem; font-weight:800;">
                        CREATE ACCOUNT & PLACE ORDER
                    </button>
                </form>

                <div style="text-align:center; margin-top:1rem; font-size:0.82rem; color:var(--text-muted);">
                    Already registered? <a href="#" id="modalSignInToggle" style="color:var(--primary-maroon); font-weight:700; text-decoration:underline;">Sign In to your account</a>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const form = document.getElementById('modalSignUpForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('modalAuthSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';

        try {
            const nameVal = document.getElementById('modalFullName').value.trim();
            const emailVal = document.getElementById('modalEmail').value.trim();
            const phoneVal = document.getElementById('modalPhone').value.trim();
            const passVal = document.getElementById('modalPassword').value;

            await signUpUser(emailVal, passVal, nameVal, phoneVal, 'customer');
            
            // Auto fill checkout form
            const mainForm = document.getElementById('checkoutForm');
            if (mainForm) {
                if (mainForm.elements['fullName']) mainForm.elements['fullName'].value = nameVal;
                if (mainForm.elements['email']) mainForm.elements['email'].value = emailVal;
                if (mainForm.elements['phone']) mainForm.elements['phone'].value = phoneVal;
            }

            document.getElementById(modalId).remove();
            onAccountReadyCallback();

        } catch(err) {
            alert("Account creation error: " + (err.message || 'Please check input details.'));
            submitBtn.disabled = false;
            submitBtn.textContent = 'CREATE ACCOUNT & PLACE ORDER';
        }
    });

    document.getElementById('modalSignInToggle')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById(modalId).remove();
        window.location.href = 'login.html';
    });
}

function showSuccessModal(order) {
    const modalHTML = `
        <div style="position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(4px); z-index:3000; display:flex; align-items:center; justify-content:center; padding:1rem;">
            <div style="background:var(--bg-white); border-radius:var(--radius-lg); padding:2.5rem; max-width:520px; width:100%; text-align:center; box-shadow:var(--shadow-lg); border:2px solid var(--gold-accent);">
                <div style="width:64px; height:64px; background:#D1FAE5; color:#065F46; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem; font-size:2.2rem; font-weight:800;">✓</div>
                <h2 style="font-family:var(--font-heading); font-size:2rem; color:var(--primary-maroon); margin-bottom:0.5rem; font-weight:800;">Order Placed Successfully!</h2>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">Thank you for shopping with Shree Aura Cottons. Your order reference ID is <strong>${order.id}</strong>.</p>
                <div style="background:var(--bg-cream); padding:1rem 1.25rem; border-radius:var(--radius-md); text-align:left; margin-bottom:1.5rem; font-size:0.85rem; border:1px solid var(--border-color);">
                    <p style="margin-bottom:0.3rem;"><strong>Recipient:</strong> ${order.customer_name}</p>
                    <p style="margin-bottom:0.3rem;"><strong>Delivery Address:</strong> ${order.address}, ${order.city}, ${order.state} - ${order.pincode}</p>
                    <p style="margin:0;"><strong>Total Amount:</strong> ₹${Number(order.total_amount).toLocaleString('en-IN')}</p>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.75rem;">
                    <a href="wishlist.html?tab=orders" class="btn btn-primary" style="width:100%; padding:0.8rem; font-weight:800;">📦 VIEW MY ORDER CATALOG</a>
                    <a href="index.html" class="btn btn-outline" style="width:100%; padding:0.6rem;">Continue Shopping</a>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}
