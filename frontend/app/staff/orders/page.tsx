"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { RoleGate } from '@/components/RoleGate';

const STATUSES = ['placed','making','ready','delivering','completed'] as const;

type Order = any;

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    apiFetch<{ orders: Order[] }>(`/api/orders`).then((res) => setOrders(res.orders));
    const s = getSocket();
    function onCreated(payload: any){ setOrders((prev) => [payload.order, ...prev]); }
    function onUpdated(payload: any){ setOrders((prev) => prev.map((o) => o._id === payload.order._id ? payload.order : o)); }
    s.on('order:created', onCreated);
    s.on('order:updated', onUpdated);
    return () => { s.off('order:created', onCreated); s.off('order:updated', onUpdated); };
  }, []);

  async function setStatus(orderId: string, status: string) {
    const res = await apiFetch<{ order: Order }>(`/api/orders/${orderId}/status`, { method: 'PATCH', body: { status } });
    setOrders((prev) => prev.map((o) => (o._id === res.order._id ? res.order : o)));
  }

  const grouped = useMemo(() => {
    const g: Record<string, Order[]> = {};
    for (const s of STATUSES) g[s] = [];
    for (const o of orders) g[o.status]?.push(o);
    return g;
  }, [orders]);

  return (
    <RoleGate roles={["staff","admin"]}>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {STATUSES.map((s) => (
        <div key={s} className="card">
          <div className="font-semibold mb-2 capitalize">{s}</div>
          <div className="space-y-2">
            {grouped[s].map((o) => (
              <div key={o._id} className="border rounded p-2">
                <div className="text-sm">#{o._id.slice(-6)} • ₹{o.totalAmount}</div>
                <div className="text-xs text-slate-600">{o.items.map((i:any)=>i.name).join(', ')}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STATUSES.filter((x)=>x!==o.status).map((next) => (
                    <button key={next} className="btn" onClick={() => setStatus(o._id, next)}>{next}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    </RoleGate>
  );
}
