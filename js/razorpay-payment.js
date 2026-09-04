// ==============================================================================
// SHREE AURA COTTONS - RAZORPAY FRONTEND PAYMENT MODULE
// ==============================================================================

/**
 * Initiates Razorpay payment flow securely.
 * 
 * @param {Object} shippingData - Customer shipping address details
 * @param {Array} cartItems - Shopping cart items
 * @param {Function} onSuccess - Callback invoked on successful payment verification
 * @param {Function} onError - Callback invoked on error or payment cancellation
 */
export async function initiateRazorpayPayment(shippingData, cartItems, onSuccess, onError) {
    try {
        // 1. Call Backend API to create Razorpay Order
        const response = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cartItems,
                shipping_address: shippingData
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to initialize Razorpay payment order.');
        }

        // 2. Ensure Razorpay Checkout SDK is loaded
        if (typeof window.Razorpay === 'undefined') {
            throw new Error('Razorpay Checkout SDK is loading. Please check your internet connection and try again.');
        }

        // 3. Configure Razorpay Modal Options
        const options = {
            key: data.key_id,
            amount: data.amount,
            currency: data.currency || 'INR',
            name: 'Shree Aura Cottons',
            description: `Order #${data.order_id}`,
            image: 'assets/logo.png',
            order_id: data.razorpay_order_id,
            prefill: {
                name: data.customer?.name || shippingData.fullName || '',
                email: data.customer?.email || shippingData.email || '',
                contact: data.customer?.contact || shippingData.phone || ''
            },
            theme: {
                color: '#7A1C2C' // Shree Aura primary maroon brand color
            },
            handler: async function (paymentResponse) {
                try {
                    // 4. Verify Payment Signature Server-Side
                    const verifyRes = await fetch('/api/payment/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: paymentResponse.razorpay_order_id,
                            razorpay_payment_id: paymentResponse.razorpay_payment_id,
                            razorpay_signature: paymentResponse.razorpay_signature,
                            order_id: data.order_id
                        })
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyRes.ok && verifyData.success) {
                        if (typeof onSuccess === 'function') {
                            onSuccess({
                                id: data.order_id,
                                customer_name: shippingData.fullName,
                                address: shippingData.address,
                                city: shippingData.city,
                                state: shippingData.state,
                                pincode: shippingData.pincode,
                                total_amount: data.amount / 100,
                                razorpay_payment_id: paymentResponse.razorpay_payment_id
                            });
                        }
                    } else {
                        throw new Error(verifyData.error || 'Payment verification failed.');
                    }
                } catch (err) {
                    console.error("Payment verification error:", err);
                    if (typeof onError === 'function') {
                        onError(err.message || 'Payment verification failed.');
                    }
                }
            },
            modal: {
                ondismiss: function () {
                    if (typeof onError === 'function') {
                        onError('Payment cancelled. Your items remain saved in your cart.');
                    }
                }
            }
        };

        // 5. Open Razorpay Checkout Window
        const rzpModal = new window.Razorpay(options);
        
        rzpModal.on('payment.failed', function (resp) {
            console.warn("Razorpay payment failed event:", resp.error);
            if (typeof onError === 'function') {
                onError(resp.error.description || 'Payment transaction failed.');
            }
        });

        rzpModal.open();

    } catch (err) {
        console.error("Razorpay initiation error:", err);
        if (typeof onError === 'function') {
            onError(err.message || 'Unable to open Razorpay payment gateway.');
        }
    }
}
