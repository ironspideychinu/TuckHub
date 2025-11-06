"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { RoleGate } from '@/components/RoleGate';

export default function StaffMenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);

  async function refresh() {
    const res = await apiFetch<{ items: any[] }>(`/api/menu`);
    setItems(res.items);
  }

  useEffect(() => { refresh(); }, []);

  async function toggleAvailability(id: string, available: boolean) {
    await apiFetch(`/api/menu/${id}`, { method: 'PATCH', body: { available } });
    refresh();
  }

  async function updateStock(id: string, stock: number) {
    await apiFetch(`/api/menu/${id}`, { method: 'PATCH', body: { stock } });
    refresh();
  }

  async function addItem() {
    await apiFetch(`/api/menu`, { method: 'POST', body: { name, price } });
    setName(''); setPrice(0);
    refresh();
  }

  return (
    <RoleGate roles={["staff","admin"]}>
    <div className="space-y-4">
      <div className="card flex gap-2">
        <input className="border rounded px-3 py-2" placeholder="Item name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Price" type="number" value={price} onChange={(e)=>setPrice(Number(e.target.value))} />
        <button className="btn" onClick={addItem}>Add</button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((it)=> (
          <div key={it._id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-sm text-slate-600">₹{it.price}</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={() => toggleAvailability(it._id, !it.available)}>
                {it.available ? 'Mark Unavailable' : 'Mark Available'}
              </button>
              <input type="number" className="border rounded px-2 py-1 w-24" value={it.stock ?? 0} onChange={(e)=>updateStock(it._id, Number(e.target.value))} />
            </div>
          </div>
        ))}
      </div>
    </div>
    </RoleGate>
  );
}
