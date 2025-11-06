"use client";
import React from 'react';
import { useCart } from '@/components/CartProvider';
import Link from 'next/link';

export default function CartPage() {
  const { items, remove, total, clear } = useCart();
  return (
    <div className="card">
      <h1 className="text-xl font-semibold mb-4">Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty. <Link href="/menu" className="text-blue-600">Browse menu</Link></p>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.itemId} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{i.name} × {i.qty}</div>
                <div className="text-sm text-slate-600">₹{i.price}</div>
              </div>
              <button className="text-red-600" onClick={() => remove(i.itemId)}>Remove</button>
            </div>
          ))}
          <div className="flex justify-between border-t pt-3">
            <div className="font-medium">Total</div>
            <div className="font-semibold">₹{total}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={clear}>Clear</button>
            <Link href="/checkout" className="btn">Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
}
