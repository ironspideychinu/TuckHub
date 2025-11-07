"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Self-pickup flow: placed -> making -> ready -> completed
const STATUS_FLOW = ['placed', 'making', 'ready', 'completed'] as const;

const STATUS_INFO: Record<string, { label: string; icon: string; description: string; }> = {
  placed: { label: 'Order Placed', icon: 'receipt_long', description: 'We have received your order and will begin preparing it shortly.' },
  making: { label: 'Being Prepared', icon: 'soup_kitchen', description: 'Our chefs are busy preparing your delicious meal.' },
  ready: { label: 'Ready for Pickup', icon: 'local_mall', description: 'Your order is ready! Please come and collect it.' },
  // delivering removed for tuckshop context
  completed: { label: 'Delivered', icon: 'check_circle', description: 'Your order has been successfully delivered. Enjoy!' },
  cancelled: { label: 'Cancelled', icon: 'cancel', description: 'This order has been cancelled.' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id || !user?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiFetch<{ order: any }>(`/api/orders/${id}`);
        if (!cancelled) setOrder(res.order);
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || 'Failed to fetch order details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    const s = getSocket();
    const onOrderUpdated = (payload: any) => {
      if (payload.order?._id === id) {
        setOrder(payload.order);
        toast.success(`Order status updated to: ${payload.order.status}`);
      }
    };
    s.on('order:updated', onOrderUpdated);
    return () => { cancelled = true; s.off('order:updated', onOrderUpdated); };
  }, [id, user?.id]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="loader"></div></div>;
  }

  if (!order) {
    return (
      <div className="container mx-auto max-w-2xl py-20 text-center">
        <div className="glass p-8 rounded-xl">
          <div className="text-7xl mb-4">🤷</div>
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark mb-6">We couldn't find the order you're looking for. It might have been removed or the link is incorrect.</p>
          <Link href="/orders" className="btn-primary inline-flex items-center justify-center gap-2 h-12 px-6 font-bold rounded-lg">
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = STATUS_FLOW.indexOf(order.status as any);
  const currentStatusInfo = STATUS_INFO[order.status] || { label: 'Unknown Status', icon: 'help', description: 'The order status is currently unknown.' };

  return (
    <main className="flex-1">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 pb-8">
          <Link href="/orders" className="btn-secondary flex items-center justify-center gap-2 h-10 px-4 rounded-lg font-bold">
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Orders
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.itemId || item._id} className="flex items-center gap-4 p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
                    <div className="bg-primary/10 text-primary text-2xl flex items-center justify-center aspect-square rounded-lg size-16 shrink-0">
                      {item.image || '🍔'}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{item.name}</div>
                      <div className="text-sm text-text-muted-light dark:text-text-muted-dark">₹{item.price.toFixed(2)} × {item.qty}</div>
                    </div>
                    <div className="font-bold text-lg">₹{(item.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Progress Tracker */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Order Progress</h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-light dark:bg-border-dark"></div>
                <div className="space-y-8">
                  {STATUS_FLOW.map((status, idx) => {
                    const historyEntry = order.status_history.find((h: any) => h.status === status);
                    const isCompleted = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;
                    const info = STATUS_INFO[status];

                    return (
                      <div key={status} className="flex items-start gap-4 relative">
                        <div className={`z-10 flex-shrink-0 size-9 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-primary text-white' : 'bg-surface-light dark:bg-surface-dark border-2 border-border-light dark:border-border-dark'}`}>
                          <span className="material-symbols-outlined !text-base">{info.icon}</span>
                        </div>
                        <div className="flex-grow pt-1">
                          <p className={`font-bold ${isCompleted ? 'text-text-light dark:text-text-dark' : 'text-text-muted-light dark:text-text-muted-dark'}`}>{info.label}</p>
                          {historyEntry && <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{format(new Date(historyEntry.timestamp), "h:mm a")}</p>}
                        </div>
                        {isCurrent && <div className="absolute top-1 -left-1.5 size-12 bg-primary/20 rounded-full animate-ping"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div className="glass p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-16 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined !text-4xl">{currentStatusInfo.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Current Status</p>
                    <p className="text-xl font-bold">{currentStatusInfo.label}</p>
                  </div>
                </div>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-6">{currentStatusInfo.description}</p>
                
                <div className="space-y-3 mb-4 pb-4 border-b border-dashed border-border-light dark:border-border-dark">
                  <div className="flex justify-between text-text-muted-light dark:text-text-muted-dark">
                    <span>Subtotal</span>
                    <span className="font-medium text-text-light dark:text-text-dark">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted-light dark:text-text-muted-dark">
                    <span>Service Fee</span>
                    <span className="font-medium text-text-light dark:text-text-dark">₹5.00</span>
                  </div>
                </div>
                <div className="flex justify-between text-xl font-bold mb-6">
                  <span>Total</span>
                  <span>₹{(order.totalAmount + 5).toFixed(2)}</span>
                </div>
              </div>

              <div className="card">
                <h3 className="font-bold mb-3">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Order ID</span>
                    <span className="font-mono text-xs">#{order._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Date</span>
                    <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted-light dark:text-text-muted-dark">Time</span>
                    <span>{format(new Date(order.createdAt), "h:mm a")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
