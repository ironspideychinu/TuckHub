"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { RoleGate } from '@/components/RoleGate';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, { icon: string; color: string; }> = {
  ready: { icon: 'local_mall', color: 'border-teal-500' },
  delivering: { icon: 'two_wheeler', color: 'border-purple-500' },
};

export default function RunnerTasksPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await apiFetch<{ orders: any[] }>(`/api/runner/orders`);
      setOrders(res.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      toast.error("Failed to fetch delivery tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const s = getSocket();
    const onUpdate = () => refresh();
    s.on('runner:assigned', onUpdate);
    s.on('order:updated', onUpdate);
    return () => {
      s.off('runner:assigned', onUpdate);
      s.off('order:updated', onUpdate);
    };
  }, []);

  async function updateOrderStatus(id: string, status: 'delivering' | 'completed') {
    const originalOrders = [...orders];
    const optimisticUpdate = orders.map(o => o._id === id ? { ...o, status } : o);
    setOrders(optimisticUpdate);

    try {
      await apiFetch(`/api/orders/${id}/status`, { method: 'PATCH', body: { status } });
      toast.success(`Order marked as ${status}!`);
      if (status === 'completed') {
        setTimeout(refresh, 1000); // Refresh to move to completed list
      }
    } catch (error) {
      toast.error("Failed to update order status.");
      setOrders(originalOrders); // Revert on failure
    }
  }

  const activeOrders = orders.filter(o => o.status === 'ready' || o.status === 'delivering');
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <RoleGate roles={["runner"]}>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-4xl font-black tracking-tight">My Deliveries</h1>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 text-lg font-medium px-4 py-2 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
              <span className="text-primary">{activeOrders.length}</span>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2 text-lg font-medium px-4 py-2 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
              <span className="text-green-500">{completedOrders.length}</span>
              <span>Completed</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><div className="loader"></div></div>
        ) : activeOrders.length > 0 ? (
          <div className="grid grid-cols-1 @lg:grid-cols-2 @4xl:grid-cols-3 gap-6">
            {activeOrders.map((order) => {
              const statusInfo = STATUS_STYLES[order.status] || { icon: 'help', color: 'border-gray-500' };
              return (
                <div key={order._id} className={`card flex flex-col justify-between gap-4 border-l-4 ${statusInfo.color}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">Order #{order._id.slice(-6)}</p>
                      <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                        {format(new Date(order.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="font-bold text-primary text-xl">₹{order.totalAmount.toFixed(2)}</div>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item: any) => (
                      <div key={item._id} className="flex items-center gap-3 text-sm p-2 bg-surface-light dark:bg-surface-dark rounded-md">
                        <span className="font-bold">{item.qty}x</span>
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border-light dark:border-border-dark">
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'delivering')}
                        className="btn-primary w-full h-11 flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">two_wheeler</span>
                        Start Delivery
                      </button>
                    )}
                    {order.status === 'delivering' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'completed')}
                        className="w-full h-11 flex items-center justify-center gap-2 rounded-lg font-bold bg-green-500 hover:bg-green-600 text-white"
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
            <div className="text-7xl mb-4">�</div>
            <p className="text-2xl font-bold mb-2">All Clear!</p>
            <p className="text-text-muted-light dark:text-text-muted-dark">There are no active delivery tasks. New tasks will appear here.</p>
          </div>
        )}

        {completedOrders.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Completed Today</h2>
            <div className="card p-4 space-y-3">
              {completedOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-surface-light dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-500">check</span>
                    </div>
                    <div>
                      <p className="font-medium">Order #{order._id.slice(-6)}</p>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        Delivered at {format(new Date(order.updatedAt), "h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-text-light dark:text-text-dark">₹{order.totalAmount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </RoleGate>
  );
}
