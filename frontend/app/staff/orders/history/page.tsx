"use client";
import React, { useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface OrderItem { name: string; qty: number; price: number; }
interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'placed' | 'making' | 'ready' | 'completed' | 'pending_payment';
  createdAt: string;
}

export default function StaffOrderHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data } = useSWR<{ orders: Order[] }>("/api/orders", apiFetch);
  const [status, setStatus] = useState<'all' | Order['status']>('all');

  if (user?.role !== 'staff' && user?.role !== 'admin') {
    router.push('/');
    return null;
  }

  const orders = data?.orders || [];
  const filtered = useMemo(() => {
    return orders.filter(o => status === 'all' ? true : o.status === status);
  }, [orders, status]);

  return (
    <main className="flex-1">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 pb-6">
          <h1 className="text-3xl font-black tracking-tight">Order History</h1>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="h-10 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="placed">Placed</option>
              <option value="making">Cooking</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="pending_payment">Pending Payment</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {filtered.map((o) => (
                  <tr key={o._id}>
                    <td className="px-6 py-4 text-sm font-semibold">#{o._id.slice(-6)}</td>
                    <td className="px-6 py-4 text-sm">{format(new Date(o.createdAt), 'MMM d, yyyy h:mm a')}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {o.items.slice(0, 3).map((it, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-xs">
                            {it.name} ×{it.qty}
                          </span>
                        ))}
                        {o.items.length > 3 && (
                          <span className="text-xs text-text-muted-light dark:text-text-muted-dark">+{o.items.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">₹{o.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className="px-2 py-1 rounded bg-border-light dark:bg-border-dark">
                        {o.status === 'making' ? 'Cooking' : o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
