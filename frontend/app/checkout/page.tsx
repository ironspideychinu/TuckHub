"use client";
import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const serviceFee = 5;
  const totalAmount = total + serviceFee;

  async function handlePayment() {
    try {
      setLoading(true);
      if (typeof window === 'undefined' || !window.Razorpay) {
        toast.error('Payment SDK not loaded yet. Please try again in a moment.');
        setLoading(false);
        return;
      }
      
      if (!user) {
        toast.error('Please login to place an order.');
        router.push('/auth/login');
        return;
      }
      
      if (items.length === 0) {
        toast.error('Your cart is empty.');
        router.push('/menu');
        return;
      }

      // Create Razorpay order
      const { razorpayOrderId, amount, currency, orderId } = await apiFetch<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        orderId: string;
      }>('/api/orders/create-payment-intent', {
        method: 'POST',
        body: { items },
      });

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
        amount: amount * 100, // amount in paise
        currency: currency,
        name: 'TuckHub',
        description: 'Campus Food Order',
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            await apiFetch('/api/orders/verify-payment', {
              method: 'POST',
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderId,
              },
            });

            clear();
            toast.success('Payment successful! Order placed.');
            router.push(`/orders/${orderId}`);
          } catch (error: any) {
            toast.error(error.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#ee8c2b',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl py-20 text-center">
        <div className="glass p-8 rounded-xl">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark mb-6">Please log in to proceed with your checkout.</p>
          <Link href="/auth/login" className="btn-primary inline-flex items-center justify-center gap-2 h-12 px-6 font-bold rounded-lg">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="container mx-auto max-w-2xl py-20 text-center">
        <div className="glass p-8 rounded-xl">
          <div className="text-7xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold mb-2">Your Cart is Empty</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark mb-6">You can't checkout with an empty cart. Let's find something delicious!</p>
          <Link href="/menu" className="btn-primary inline-flex items-center justify-center gap-2 h-12 px-6 font-bold rounded-lg">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3 pb-8">
          <h1 className="text-4xl font-black tracking-tight">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.itemId} className="flex items-center gap-4 p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
                    <div className="bg-primary/10 text-primary text-2xl flex items-center justify-center aspect-square rounded-lg size-16 shrink-0">
                      {item.image || '🍔'}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{item.name}</div>
                      <div className="text-sm text-text-muted-light dark:text-text-muted-dark">₹{item.price.toFixed(2)} × {item.qty}</div>
                    </div>
                    <div className="font-bold text-lg">₹{(item.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="glass p-6 rounded-xl">
                <h2 className="text-xl font-bold mb-4">Payment</h2>
                <div className="space-y-3 mb-4 pb-4 border-b border-dashed border-border-light dark:border-border-dark">
                  <div className="flex justify-between text-text-muted-light dark:text-text-muted-dark">
                    <span>Subtotal</span>
                    <span className="font-medium text-text-light dark:text-text-dark">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted-light dark:text-text-muted-dark">
                    <span>Service Fee</span>
                    <span className="font-medium text-text-light dark:text-text-dark">₹{serviceFee.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xl font-bold mb-6">
                  <span>Total</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="btn-primary w-full h-12 text-center rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Pay with Razorpay'}
                </button>

                <div className="text-xs text-text-muted-light dark:text-text-muted-dark text-center mt-3">
                  Payments are securely processed by Razorpay.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
