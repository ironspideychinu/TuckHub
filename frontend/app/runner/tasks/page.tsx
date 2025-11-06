"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { RoleGate } from '@/components/RoleGate';

export default function RunnerTasksPage() {
  const [orders, setOrders] = useState<any[]>([]);

  async function refresh(){
    const res = await apiFetch<{ orders: any[] }>(`/api/runner/orders`);
    setOrders(res.orders);
  }

  useEffect(() => {
    refresh();
    const s = getSocket();
    const onUpdate = () => refresh();
    s.on('runner:assigned', onUpdate);
    s.on('order:updated', onUpdate);
    return () => { s.off('runner:assigned', onUpdate); s.off('order:updated', onUpdate); };
  }, []);

  async function markDelivered(id: string) {
    await apiFetch(`/api/runner/orders/${id}/delivered`, { method: 'PATCH' });
    refresh();
  }

  return (
    <RoleGate roles={["runner"]}>
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o._id} className="card flex items-center justify-between">
          <div>
            <div className="font-medium">#{o._id.slice(-6)}</div>
            <div className="text-sm text-slate-600">Status: {o.status}</div>
          </div>
          {o.status !== 'completed' && <button className="btn" onClick={() => markDelivered(o._id)}>Mark delivered</button>}
        </div>
      ))}
    </div>
    </RoleGate>
  );
}
