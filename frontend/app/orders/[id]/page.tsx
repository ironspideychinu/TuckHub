"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchOrder() {
      const res = await apiFetch<{ orders: any[] }>(`/api/orders/user/${localStorage.getItem('userId')}`);
      const found = res.orders.find((o) => o._id === id);
      if (mounted) setOrder(found || null);
    }
    fetchOrder();

    const s = getSocket();
    function onUpdated(payload: any) {
      if (payload.order && payload.order._id === id) setOrder(payload.order);
    }
    s.on('order:updated', onUpdated);
    s.on('order:created', onUpdated);
    return () => {
      mounted = false;
      s.off('order:updated', onUpdated);
      s.off('order:created', onUpdated);
    };
  }, [id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Order #{order._id.slice(-6)}</h1>
        <div>Status: <span className="font-semibold">{order.status}</span></div>
      </div>
      <div className="space-y-2">
        {order.items.map((it: any) => (
          <div key={it.itemId} className="flex justify-between">
            <div>{it.name} × {it.qty}</div>
            <div>₹{it.price * it.qty}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between border-t pt-3">
        <div>Total</div>
        <div className="font-semibold">₹{order.totalAmount}</div>
      </div>
      <div className="mt-4">
        <div className="font-medium mb-1">Status history</div>
        <ul className="text-sm list-disc pl-5">
          {order.status_history.map((h: any, idx: number) => (
            <li key={idx}>{h.status} at {new Date(h.timestamp).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
