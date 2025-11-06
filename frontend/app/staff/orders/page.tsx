"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { RoleGate } from '@/components/RoleGate';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUSES = ['placed', 'making', 'ready', 'delivering', 'completed'] as const;
type OrderStatus = typeof STATUSES[number];

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: string; }> = {
  placed: { label: 'New Orders', icon: 'receipt_long' },
  making: { label: 'In Kitchen', icon: 'soup_kitchen' },
  ready: { label: 'Ready for Pickup', icon: 'local_mall' },
  delivering: { label: 'Out for Delivery', icon: 'two_wheeler' },
  completed: { label: 'Completed', icon: 'check_circle' },
};

type Order = any;

function OrderCard({ order, index }: { order: Order, index: number }) {
  return (
    <Draggable draggableId={order._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`card p-4 mb-3 transition-shadow ${snapshot.isDragging ? 'shadow-2xl scale-105' : 'shadow-md'}`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-bold text-text-light dark:text-text-dark">#{order._id.slice(-6)}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{format(new Date(order.createdAt), "h:mm a")}</p>
            </div>
            <p className="font-bold text-primary">₹{order.totalAmount.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            {order.items.map((item: any) => (
              <div key={item._id} className="text-sm text-text-light dark:text-text-dark">
                <span className="font-medium">{item.qty}×</span> {item.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </Draggable>
  );
}

function OrderColumn({ status, orders }: { status: OrderStatus, orders: Order[] }) {
  const config = STATUS_CONFIG[status];
  return (
    <div className="flex flex-col w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 flex-shrink-0">
      <div className="sticky top-0 z-10 glass rounded-t-lg p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{config.icon}</span>
            <h2 className="font-bold text-text-light dark:text-text-dark">{config.label}</h2>
          </div>
          <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-sm">{orders.length}</span>
        </div>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-grow min-h-[200px] rounded-b-lg p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
          >
            {orders.map((order, index) => (
              <OrderCard key={order._id} order={order} index={index} />
            ))}
            {provided.placeholder}
            {orders.length === 0 && (
              <div className="text-center py-10 text-text-muted-light dark:text-text-muted-dark">
                <div className="text-3xl mb-2">{config.icon}</div>
                <p className="text-sm">No orders here</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ orders: Order[] }>(`/api/orders`)
      .then((res) => setOrders(res.orders))
      .catch(() => toast.error("Failed to fetch orders."))
      .finally(() => setLoading(false));

    const s = getSocket();
    const onOrderCreated = (payload: any) => {
      setOrders((prev) => [payload.order, ...prev]);
      toast.success(`New order #${payload.order._id.slice(-6)} received!`);
    };
    const onOrderUpdated = (payload: any) => {
      setOrders((prev) => prev.map((o) => o._id === payload.order._id ? payload.order : o));
    };
    s.on('order:created', onOrderCreated);
    s.on('order:updated', onOrderUpdated);
    return () => {
      s.off('order:created', onOrderCreated);
      s.off('order:updated', onOrderUpdated);
    };
  }, []);

  const groupedOrders = useMemo(() => {
    const grouped: Record<OrderStatus, Order[]> = { placed: [], making: [], ready: [], delivering: [], completed: [] };
    for (const order of orders) {
      if (grouped[order.status as OrderStatus]) {
        grouped[order.status as OrderStatus].push(order);
      }
    }
    // Sort each group by creation date
    for (const status of STATUSES) {
        grouped[status].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return grouped;
  }, [orders]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const newStatus = destination.droppableId as OrderStatus;
    const originalStatus = source.droppableId as OrderStatus;
    
    // Optimistic UI update
    const movedOrder = orders.find(o => o._id === draggableId);
    if (!movedOrder) return;

    const newOrders = orders.map(o => o._id === draggableId ? { ...o, status: newStatus } : o);
    setOrders(newOrders);

    try {
      await apiFetch(`/api/orders/${draggableId}/status`, { method: 'PATCH', body: { status: newStatus } });
      toast.success(`Order #${draggableId.slice(-6)} moved to ${STATUS_CONFIG[newStatus].label}`);
    } catch (error) {
      toast.error('Failed to update order status.');
      // Revert on failure
      setOrders(orders);
    }
  };

  return (
    <RoleGate roles={["staff", "admin"]}>
      <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 flex-shrink-0">
          <h1 className="text-4xl font-black tracking-tight">Order Dashboard</h1>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><div className="loader"></div></div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 flex gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4">
              {STATUSES.map((status) => (
                <OrderColumn key={status} status={status} orders={groupedOrders[status]} />
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </RoleGate>
  );
}
