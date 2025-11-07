"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type CartItem = { itemId: string; name: string; price: number; qty: number; image?: string; };

type CartContextType = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (itemId: string) => void;
  clear: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cart from localStorage');
      localStorage.removeItem('cart');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return; // Prevent overwriting before initial load (React 18 strict mode double-invoke)
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items, loaded]);

  function add(item: CartItem) {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.itemId === item.itemId);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + item.qty };
        return copy;
      }
      return [...prev, item];
    });
  }
  function remove(itemId: string) {
    setItems((prev) => prev.filter((p) => p.itemId !== itemId));
  }
  function clear() { setItems([]); }

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);

  return <CartContext.Provider value={{ items, add, remove, clear, total }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
