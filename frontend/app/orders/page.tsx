"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ orders: any[] }>(`/api/orders/user/${user.id}`).then((res) => setOrders(res.orders));
  }, [user]);

  if (!user) return <p>Please login to view your orders.</p>;

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o._id} className="card flex items-center justify-between">
          <div>
            <div className="font-medium">Order #{o._id.slice(-6)}</div>
            <div className="text-sm text-slate-600">Status: {o.status} • ₹{o.totalAmount}</div>
          </div>
          <Link className="btn" href={`/orders/${o._id}`}>View</Link>
        </div>
      ))}
    </div>
  );
}
