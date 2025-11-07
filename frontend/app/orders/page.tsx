"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_STYLES: Record<string, { icon: string; color: string; }> = {
  placed: { icon: 'receipt_long', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  making: { icon: 'soup_kitchen', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' },
  ready: { icon: 'local_mall', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' },
  completed: { icon: 'check_circle', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  cancelled: { icon: 'cancel', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    apiFetch<{ orders: any[] }>(`/api/orders/user/${user.id}`)
      .then((res) => setOrders(res.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())))
      .catch(() => toast.error("Failed to fetch orders."))
      .finally(() => setLoading(false));

    const s = getSocket();
  const userId = user.id;
    
    const onOrderCreated = (payload: any) => {
      if (payload.order.userId === userId) {
        setOrders((prev) => [payload.order, ...prev]);
        toast.success(`New order #${payload.order._id.slice(-6)} placed!`);
      }
    };
    const onOrderUpdated = (payload: any) => {
      setOrders((prev) => prev.map((o) => o._id === payload.order._id ? payload.order : o));
      toast(`Order #${payload.order._id.slice(-6)} has been updated.`);
    };

    s.on('order:created', onOrderCreated);
    s.on('order:updated', onOrderUpdated);
    return () => {
      s.off('order:created', onOrderCreated);
      s.off('order:updated', onOrderUpdated);
    };
  }, [user]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="loader"></div></div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl py-20 text-center">
        <div className="glass p-8 rounded-xl">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark mb-6">Please log in to view your order history.</p>
          <Link href="/auth/login" className="btn-primary inline-flex items-center justify-center gap-2 h-12 px-6 font-bold rounded-lg">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3 pb-8">
          <h1 className="text-4xl font-black tracking-tight">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
            <div className="text-7xl mb-4">📦</div>
            <p className="text-2xl font-bold mb-2">No Orders Yet</p>
            <p className="text-text-muted-light dark:text-text-muted-dark mb-6">Your past and current orders will appear here.</p>
            <Link href="/menu" className="btn-primary inline-flex items-center justify-center gap-2 h-12 px-6 font-bold rounded-lg">
              Start Ordering
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = STATUS_STYLES[order.status] || { icon: 'help', color: 'bg-gray-100 text-gray-700' };
              return (
                <div key={order._id} className="card hover:shadow-lg transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold">Order #{order._id.slice(-6)}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${statusInfo.color}`}>
                          <span className="material-symbols-outlined !text-sm">{statusInfo.icon}</span>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-text-muted-light dark:text-text-muted-dark mb-3">
                        {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {order.items.slice(0, 4).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark px-2 py-1 rounded-md">
                            <span>{item.name}</span>
                            <span className="text-text-muted-light dark:text-text-muted-dark">×{item.qty}</span>
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark px-2 py-1 rounded-md font-medium">
                            +{order.items.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-4">
                       <div className="text-xl font-bold text-primary text-right">
                        ₹{order.totalAmount.toFixed(2)}
                      </div>
                      <Link
                        href={`/orders/${order._id}`}
                        className="btn-primary flex items-center justify-center gap-2 h-11 px-5 rounded-lg font-bold whitespace-nowrap"
                      >
                        Track Order
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
