"use client";
import React from 'react';
import { useCart } from '@/components/CartProvider';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, remove, total, clear, add } = useCart();

  const updateQuantity = (item: any, delta: number) => {
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      remove(item.itemId);
      toast.error(`${item.name} removed from cart.`);
    } else {
      // The add function in CartProvider handles updates if the item exists
      add({ ...item, qty: newQty });
      toast.success(`Cart updated for ${item.name}.`);
    }
  };

  const handleRemove = (itemId: string, name: string) => {
    remove(itemId);
    toast.error(`${name} removed from cart.`);
  }

  const serviceFee = 5; // Example service fee

  return (
    <main className="flex-1">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* PageHeading */}
        <div className="flex flex-wrap items-baseline justify-between gap-3 pb-8">
          <h1 className="text-4xl font-black tracking-tight">Your Cart</h1>
          <Link href="/menu" className="text-primary text-sm font-medium hover:underline">
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
            <div className="text-7xl mb-4">🛒</div>
            <p className="text-2xl font-bold mb-2">Your Cart is Empty</p>
            <p className="text-text-muted-light dark:text-text-muted-dark mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Link href="/menu" className="btn-primary inline-flex items-center justify-center gap-2 h-12 px-6 font-bold rounded-lg">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Cart Items Column */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.itemId} className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                    <div className="bg-primary/10 text-primary text-3xl flex items-center justify-center aspect-square rounded-lg size-16 shrink-0">
                      {item.image || '🍔'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-base line-clamp-1">{item.name}</p>
                      <p className="text-primary text-sm font-medium">₹{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item, -1)} className="text-base font-medium flex h-8 w-8 items-center justify-center rounded-full bg-border-light dark:bg-border-dark cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">-</button>
                      <span className="font-bold w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateQuantity(item, 1)} className="text-base font-medium flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white cursor-pointer hover:bg-primary/90 transition-colors">+</button>
                    </div>
                    <p className="w-20 text-right font-semibold text-base">₹{(item.price * item.qty).toFixed(2)}</p>
                    <button onClick={() => handleRemove(item.itemId, item.name)} className="text-text-muted-light dark:text-text-muted-dark hover:text-red-500 dark:hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="glass p-6 rounded-xl">
                  <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-text-muted-light dark:text-text-muted-dark">
                      <span>Subtotal</span>
                      <span className="font-medium text-text-light dark:text-text-dark">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-text-muted-light dark:text-text-muted-dark">
                      <span>Service Fee</span>
                      <span className="font-medium text-text-light dark:text-text-dark">₹{serviceFee.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="my-4 border-t border-dashed border-border-light dark:border-border-dark"></div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>₹{(total + serviceFee).toFixed(2)}</span>
                  </div>
                  <Link href="/checkout" className="mt-6 flex w-full items-center justify-center rounded-lg h-12 px-4 btn-primary text-base font-bold">
                    Proceed to Checkout
                  </Link>
                  <button
                    onClick={() => {
                      clear();
                      toast.success("Cart cleared!");
                    }}
                    className="mt-3 w-full text-sm text-text-muted-light dark:text-text-muted-dark hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
