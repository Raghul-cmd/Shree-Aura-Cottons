import { getCart, getCartTotals, clearCart } from './cart.js';
import { createOrder } from './supabase.js';
import { initiateRazorpayPayment } from './razorpay-payment.js';

document.addEventListener('DOMContentLoaded', () => {
    const cart = getCart();
    
    if (cart.length === 0) {
        window.location.href = '/shop.html';
        return;
    }
    
    renderOrderSummary();
    
    const checkoutForm = document.getElementById('checkoutForm');
    checkoutForm?.addEventListener('submit', handleCheckoutSubmit);
});

function renderOrderSummary() {
    const cart = getCart();
    const totals = getCartTotals();
    
    const summaryItemsEl = document.getElementById('checkoutItemsSummary');
    if (summaryItemsEl) {
        summaryItemsEl.innerHTML = cart.map(item => `
            <div class="summary-row" style="align-items: center;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <img src="${item.image}" alt="${item.name}" style="width:40px; height:50px; object-fit:cover; border-radius:4px;">
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
    
    const submitBtn = document.getElementById('placeOrderBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `Processing Order...`;

    try {
        const formData = new FormData(e.target);
        const selectedPaymentMethod = formData.get('paymentMethod');
        const cartItems = getCart();

        const shippingData = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            pincode: formData.get('pincode')
        };

        if (selectedPaymentMethod === 'cod') {
            // Standard Cash on Delivery Path
            const orderPayload = {
                customer_name: shippingData.fullName,
                phone: shippingData.phone,
                email: shippingData.email,
                address: shippingData.address,
                city: shippingData.city,
                state: shippingData.state,
                pincode: shippingData.pincode,
                total_amount: getCartTotals().grandTotal,
                payment_method: 'cod',
                payment_status: 'pending',
                order_status: 'placed'
            };

            const createdOrder = await createOrder(orderPayload, cartItems);
            clearCart();
            showSuccessModal(createdOrder);
        } else {
            // Online Payment via Razorpay
            await initiateRazorpayPayment(
                shippingData,
                cartItems,
                async function onSuccess(createdOrder) {
                    clearCart();
                    showSuccessModal(createdOrder);
                },
                function onError(errMsg) {
                    alert(errMsg || "Payment was not completed. You can retry payment anytime.");
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `PLACE ORDER NOW`;
                }
            );
        }

    } catch (err) {
        console.error("Failed to place order:", err);
        alert("Failed to place order. Please try again.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = `PLACE ORDER NOW`;
    }
}

function showSuccessModal(order) {
    const modalHTML = `
        <div style="position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:1rem;">
            <div style="background:var(--bg-white); border-radius:var(--radius-lg); padding:2.5rem; max-width:500px; width:100%; text-align:center; box-shadow:var(--shadow-lg);">
                <div style="width:60px; height:60px; background:#D1FAE5; color:#065F46; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem; font-size:2rem;">✓</div>
                <h2 style="font-family:var(--font-heading); font-size:2rem; color:var(--primary-maroon); margin-bottom:0.5rem;">Order Placed Successfully!</h2>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">Thank you for shopping with Shree Aura Cottons. Your order reference ID is <strong>${order.id}</strong>.</p>
                <div style="background:var(--bg-cream); padding:1rem; border-radius:var(--radius-md); text-align:left; margin-bottom:1.5rem; font-size:0.85rem;">
                    <p style="margin-bottom:0.3rem;"><strong>Recipient:</strong> ${order.customer_name}</p>
                    <p style="margin-bottom:0.3rem;"><strong>Delivery Address:</strong> ${order.address}, ${order.city}, ${order.state} - ${order.pincode}</p>
                    <p><strong>Total Amount:</strong> ₹${Number(order.total_amount).toLocaleString('en-IN')}</p>
                </div>
                <a href="/index.html" class="btn btn-primary" style="width:100%;">CONTINUE SHOPPING</a>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}
