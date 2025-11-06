"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useCart } from '@/components/CartProvider';
import { getSocket } from '@/lib/socket';

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const { add } = useCart();

  useEffect(() => {
    apiFetch<{ items: any[] }>(`/api/menu`).then((res) => setItems(res.items));
    apiFetch<{ categories: any[] }>(`/api/categories`).then((res) => setCategories(res.categories));
    const s = getSocket();
    const onStock = (p:any) => {
      setItems((prev)=> prev.map((it)=> it._id===p.itemId ? { ...it, available: p.available, stock: p.stock } : it));
    };
    s.on('stock:updated', onStock);
    return () => { s.off('stock:updated', onStock); };
  }, []);

  const shown = items.filter((i) => filter === 'all' || i.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-600">Category</label>
        <select className="border rounded px-2 py-1" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
      {shown.map((item) => (
        <div key={item._id} className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium text-slate-900">{item.name}</h3>
              <div className="text-sm text-slate-600">₹{item.price}</div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {item.category && <span className="rounded bg-slate-100 px-2 py-0.5">{item.category}</span>}
                <span className={"px-2 py-0.5 rounded "+ (item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                  {item.available ? (item.stock ? `In stock: ${item.stock}` : 'Available') : 'Unavailable'}
                </span>
              </div>
            </div>
            <button className="btn" disabled={!item.available} onClick={() => add({ itemId: item._id, name: item.name, price: item.price, qty: 1 })}>Add</button>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
