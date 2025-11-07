"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

interface OrderItem { name: string; qty: number; }

interface Order {
  _id: string;
  orderNumber?: string; // not guaranteed in current schema
  user?: { name?: string };
  items: OrderItem[];
  status: 'placed' | 'making' | 'ready' | 'completed';
  createdAt: string;
  totalAmount?: number;
}

const statusConfig: Record<Order['status'], { title: string; color: string; bgColor: string; textColor: string; }> = {
  placed: {
    title: 'Received',
    color: 'text-gray-800 dark:text-white',
    bgColor: 'bg-gray-200 dark:bg-gray-700',
    textColor: 'text-gray-700 dark:text-gray-200',
  },
  making: {
    title: 'Cooking',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    textColor: 'text-yellow-800 dark:text-yellow-300',
  },
  ready: {
    title: 'Ready to Pickup',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900',
    textColor: 'text-green-800 dark:text-green-300',
  },
  completed: {
    title: 'Completed',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    textColor: 'text-blue-800 dark:text-blue-300',
  },
};

export default function StaffOrderBoardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  // Backend returns shape { orders: [...] }
  const { data: fetchedOrders, error: fetchError } = useSWR<{ orders: Order[] }>('/api/orders', apiFetch);

  useEffect(() => {
    if (fetchedOrders?.orders) {
      setOrders(Array.isArray(fetchedOrders.orders) ? fetchedOrders.orders : []);
    }
  }, [fetchedOrders]);

  // Mobile layout detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024); // lg breakpoint
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(base + '/orders');

    const onCreated = (payload: any) => {
      if (payload?.order) {
        setOrders((prev) => [payload.order, ...prev]);
        toast.success(`New order #${payload.order._id.slice(-6)}`);
      }
    };
    const onUpdated = (payload: any) => {
      if (payload?.order) {
        setOrders((prev) => prev.map(o => o._id === payload.order._id ? payload.order : o));
      }
    };
    socket.on('order:created', onCreated);
    socket.on('order:updated', onUpdated);
    return () => { socket.off('order:created', onCreated); socket.off('order:updated', onUpdated); socket.disconnect(); };
  }, []);

  if (user?.role !== 'staff') {
    router.push('/');
    return null;
  }

  const getOrdersByStatus = (status: Order['status']) => {
    // FCFS: oldest first within each status
    return orders
      .filter((order) => order.status === status)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diff = Math.floor((now.getTime() - orderDate.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 min ago';
    return `${diff} min ago`;
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

  const newStatus = destination.droppableId as Order['status'];
    const orderId = draggableId;

    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      });

      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order))
      );

      toast.success(`Order moved to ${statusConfig[newStatus].title}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    }
  };

  const flow: Order['status'][] = ['placed', 'making', 'ready', 'completed'];
  function nextStatus(current: Order['status']): Order['status'] | null {
    const i = flow.indexOf(current);
    if (i === -1 || i === flow.length - 1) return null;
    return flow[i + 1];
  }

  async function advanceOrder(order: Order) {
    const ns = nextStatus(order.status);
    if (!ns) return;
    try {
      await apiFetch(`/api/orders/${order._id}/status`, { method: 'PATCH', body: { status: ns } });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: ns } : o)));
      toast.success(`Moved to ${statusConfig[ns].title}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update');
    }
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-64 flex-shrink-0 bg-white dark:bg-surface-dark border-r border-border-light dark:border-border-dark">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-2 px-3">
              <span className="material-symbols-outlined text-primary text-3xl">fastfood</span>
              <h1 className="text-text-light dark:text-text-dark text-lg font-bold">Campus Eats</h1>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="/staff/orders"
                className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary dark:bg-primary/20"
              >
                <span className="material-symbols-outlined">view_kanban</span>
                <p className="text-sm font-medium">Order Board</p>
              </a>
              <a
                href="/staff/menu"
                className="flex items-center gap-3 px-3 py-2 text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded-lg"
              >
                <span className="material-symbols-outlined">menu_book</span>
                <p className="text-sm font-medium">Menu</p>
              </a>
              <a
                href="/staff/orders/history"
                className="flex items-center gap-3 px-3 py-2 text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded-lg"
              >
                <span className="material-symbols-outlined">history</span>
                <p className="text-sm font-medium">History</p>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-3 py-2 text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded-lg cursor-pointer">
              <span className="material-symbols-outlined">logout</span>
              <p className="text-sm font-medium">Log Out</p>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
          <p className="text-text-light dark:text-text-dark text-2xl font-bold">
            Tuckshop Production Board
          </p>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-gray-800">
              <span className="material-symbols-outlined">notifications</span>
              {Array.isArray(orders) && orders.filter(o => o.status === 'placed').length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600"></span>
              )}
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-primary text-white flex items-center justify-center rounded-full size-10 font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <h1 className="text-text-light dark:text-text-dark text-base font-medium leading-normal">
                  {user?.name}
                </h1>
                <p className="text-text-muted-light dark:text-text-muted-dark text-sm font-normal leading-normal">
                  Tuckshop Staff
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Responsive Board */}
        {isMobile ? (
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            {(['placed', 'making', 'ready', 'completed'] as const).map((status) => {
              const statusOrders = getOrdersByStatus(status);
              const config = statusConfig[status];
              return (
                <section key={status} className="bg-surface-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg">
                  <header className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                    <h2 className={`font-bold ${config.color}`}>{config.title}</h2>
                    <span className={`px-2 py-1 text-sm font-semibold ${config.textColor} ${config.bgColor} rounded-full`}>{statusOrders.length}</span>
                  </header>
                  <div className="divide-y divide-border-light dark:divide-border-dark">
                    {statusOrders.map((order) => (
                      <div key={order._id} className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold">#{order._id.slice(-6)}</div>
                          <div className="text-xs text-text-muted-light dark:text-text-muted-dark">{getTimeAgo(order.createdAt)}</div>
                        </div>
                        <div className="text-sm text-text-light dark:text-text-dark mb-2 space-y-0.5">
                          {order.items.map((it, i) => (
                            <div key={i}>{it.qty}× {it.name}</div>
                          ))}
                        </div>
                        {order.status !== 'completed' && (
                          <button onClick={() => advanceOrder(order)} className="btn-primary h-9 px-4 rounded-lg text-sm font-bold">
                            {order.status === 'placed' ? 'Start Cooking' : order.status === 'making' ? 'Mark Ready' : 'Complete'}
                          </button>
                        )}
                      </div>
                    ))}
                    {statusOrders.length === 0 && (
                      <div className="p-6 text-center text-sm text-text-muted-light dark:text-text-muted-dark">No orders</div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex-1 grid grid-cols-4 gap-6 p-6 overflow-x-auto">
              {(['placed', 'making', 'ready', 'completed'] as const).map((status) => {
                const statusOrders = getOrdersByStatus(status);
                const config = statusConfig[status];

                return (
                  <div key={status} className="flex flex-col bg-surface-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg">
                    <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                      <h2 className={`font-bold ${config.color}`}>{config.title}</h2>
                      <span className={`px-2 py-1 text-sm font-semibold ${config.textColor} ${config.bgColor} rounded-full`}>{statusOrders.length}</span>
                    </div>

                    <Droppable droppableId={status}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 p-4 space-y-4 overflow-y-auto">
                          {statusOrders.map((order, index) => (
                            <Draggable key={order._id} draggableId={order._id} index={index}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow cursor-grab ${status === 'completed' ? 'opacity-70' : ''}`}>
                                  <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-text-light dark:text-text-dark">#{order._id.slice(-6)}</p>
                                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{getTimeAgo(order.createdAt)}</span>
                                  </div>
                                  <div className="space-y-1 text-sm text-text-light dark:text-text-dark">
                                    {order.items.map((item, idx) => (
                                      <p key={idx}>{item.qty}x {item.name}</p>
                                    ))}
                                  </div>
                                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-2">{order.user?.name || 'Student'}</p>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </main>
    </div>
  );
}
