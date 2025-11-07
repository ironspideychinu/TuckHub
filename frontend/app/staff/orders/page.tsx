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

interface OrderItem {
  menuItem: { name: string };
  quantity: number;
}

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
    title: 'Placed',
    color: 'text-gray-800 dark:text-white',
    bgColor: 'bg-gray-200 dark:bg-gray-700',
    textColor: 'text-gray-700 dark:text-gray-200',
  },
  making: {
    title: 'Making',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    textColor: 'text-yellow-800 dark:text-yellow-300',
  },
  ready: {
    title: 'Ready',
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
  const { data: fetchedOrders } = useSWR<Order[]>('/api/orders', apiFetch);

  useEffect(() => {
    if (fetchedOrders) {
      setOrders(fetchedOrders);
    }
  }, [fetchedOrders]);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    
    socket.on('orderPlaced', (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      toast.success(`New order #${order.orderNumber}`);
    });

    socket.on('orderUpdated', (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (user?.role !== 'staff' && user?.role !== 'admin') {
    router.push('/');
    return null;
  }

  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
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
      await apiFetch(`/api/orders/${orderId}`, {
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
                href="/admin/reports"
                className="flex items-center gap-3 px-3 py-2 text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-gray-800 rounded-lg"
              >
                <span className="material-symbols-outlined">bar_chart</span>
                <p className="text-sm font-medium">Reports</p>
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
            Tuckshop Order Board
          </p>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-gray-800">
              <span className="material-symbols-outlined">notifications</span>
              {orders.filter(o => o.status === 'placed').length > 0 && (
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

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 grid grid-cols-4 gap-6 p-6 overflow-x-auto">
            {(['placed', 'making', 'ready', 'completed'] as const).map((status) => {
              const statusOrders = getOrdersByStatus(status);
              const config = statusConfig[status];

              return (
                <div
                  key={status}
                  className="flex flex-col bg-surface-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg"
                >
                  <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                    <h2 className={`font-bold ${config.color}`}>{config.title}</h2>
                    <span className={`px-2 py-1 text-sm font-semibold ${config.textColor} ${config.bgColor} rounded-full`}>
                      {statusOrders.length}
                    </span>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 p-4 space-y-4 overflow-y-auto"
                      >
                        {statusOrders.map((order, index) => (
                          <Draggable key={order._id} draggableId={order._id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow cursor-grab ${
                                  status === 'completed' ? 'opacity-70' : ''
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <p className="font-bold text-text-light dark:text-text-dark">
                                    #{order.orderNumber}
                                  </p>
                                  <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                    {getTimeAgo(order.createdAt)}
                                  </span>
                                </div>
                                <div className="space-y-1 text-sm text-text-light dark:text-text-dark">
                                  {order.items.map((item, idx) => (
                                    <p key={idx}>
                                      {item.quantity}x {item.menuItem.name}
                                    </p>
                                  ))}
                                </div>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-2">
                                  {order.user?.name || 'Student'}
                                </p>
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
      </main>
    </div>
  );
}
