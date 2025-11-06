"use client";
import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useCart } from '@/components/CartProvider';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const [error, setError] = useState('');
  const router = useRouter();

  async function placeOrder() {
    try {
      if (!user) throw new Error('Please login');
      if (items.length === 0) throw new Error('Cart is empty');
      const res = await apiFetch<{ order: any }>(`/api/orders`, { method: 'POST', body: { items } });
      clear();
      router.push(`/orders/${res.order._id}`);
    } catch (e: any) {
      setError(e.message || 'Failed to place order');
    }
  }

  return (
    <div className="card">
      <h1 className="text-xl font-semibold mb-4">Checkout</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <div className="mb-4">Total: <span className="font-semibold">₹{total}</span></div>
      <button className="btn" onClick={placeOrder}>Place Order</button>
    </div>
  );
}
