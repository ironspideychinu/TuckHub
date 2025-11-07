"use client";"use client";

import React, { useEffect, useState } from 'react';import React, { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';import { apiFetch } from '@/lib/api';

import useSWR from 'swr';import { getSocket } from '@/lib/socket';

import { apiFetch } from '@/lib/api';import { RoleGate } from '@/components/RoleGate';

import { useRouter } from 'next/navigation';import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';import toast from 'react-hot-toast';

import toast from 'react-hot-toast';import { format } from 'date-fns';

import { io } from 'socket.io-client';

const STATUSES = ['placed', 'making', 'ready', 'delivering', 'completed'] as const;

interface OrderItem {type OrderStatus = typeof STATUSES[number];

  item: { name: string };

  quantity: number;const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: string; }> = {

}  placed: { label: 'New Orders', icon: 'receipt_long' },

  making: { label: 'In Kitchen', icon: 'soup_kitchen' },

interface Order {  ready: { label: 'Ready for Pickup', icon: 'local_mall' },

  _id: string;  delivering: { label: 'Out for Delivery', icon: 'two_wheeler' },

  orderNumber: string;  completed: { label: 'Completed', icon: 'check_circle' },

  items: OrderItem[];};

  total: number;

  status: 'pending' | 'preparing' | 'ready' | 'completed';type Order = any;

  createdAt: string;

  user: { name: string };function OrderCard({ order, index }: { order: Order, index: number }) {

}  return (

    <Draggable draggableId={order._id} index={index}>

const statusColumns = {      {(provided, snapshot) => (

  pending: { title: 'Placed', color: 'gray', bgColor: 'bg-gray-100 dark:bg-gray-900', textColor: 'text-gray-700 dark:text-gray-200' },        <div

  preparing: { title: 'Making', color: 'yellow', bgColor: 'bg-yellow-100 dark:bg-yellow-900', textColor: 'text-yellow-800 dark:text-yellow-300' },          ref={provided.innerRef}

  ready: { title: 'Ready', color: 'green', bgColor: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-800 dark:text-green-300' },          {...provided.draggableProps}

  completed: { title: 'Completed', color: 'blue', bgColor: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-800 dark:text-blue-300' },          {...provided.dragHandleProps}

};          className={`card p-4 mb-3 transition-shadow ${snapshot.isDragging ? 'shadow-2xl scale-105' : 'shadow-md'}`}

        >

export default function StaffOrdersPage() {          <div className="flex items-start justify-between mb-2">

  const { user } = useAuth();            <div>

  const router = useRouter();              <p className="font-bold text-text-light dark:text-text-dark">#{order._id.slice(-6)}</p>

  const [orders, setOrders] = useState<Order[]>([]);              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{format(new Date(order.createdAt), "h:mm a")}</p>

  const { data: fetchedOrders, mutate } = useSWR<Order[]>('/api/orders', apiFetch);            </div>

            <p className="font-bold text-primary">₹{order.totalAmount.toFixed(2)}</p>

  useEffect(() => {          </div>

    if (fetchedOrders) {          <div className="space-y-1">

      setOrders(fetchedOrders);            {order.items.map((item: any) => (

    }              <div key={item._id} className="text-sm text-text-light dark:text-text-dark">

  }, [fetchedOrders]);                <span className="font-medium">{item.qty}×</span> {item.name}

              </div>

  useEffect(() => {            ))}

    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');          </div>

            </div>

    socket.on('newOrder', () => {      )}

      mutate();    </Draggable>

      toast.success('New order received!');  );

    });}



    socket.on('orderUpdated', () => {function OrderColumn({ status, orders }: { status: OrderStatus, orders: Order[] }) {

      mutate();  const config = STATUS_CONFIG[status];

    });  return (

    <div className="flex flex-col w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 flex-shrink-0">

    return () => {      <div className="sticky top-0 z-10 glass rounded-t-lg p-3 mb-3">

      socket.disconnect();        <div className="flex items-center justify-between">

    };          <div className="flex items-center gap-2">

  }, [mutate]);            <span className="material-symbols-outlined text-primary">{config.icon}</span>

            <h2 className="font-bold text-text-light dark:text-text-dark">{config.label}</h2>

  if (user?.role !== 'staff' && user?.role !== 'admin') {          </div>

    router.push('/');          <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-sm">{orders.length}</span>

    return null;        </div>

  }      </div>

      <Droppable droppableId={status}>

  const getOrdersByStatus = (status: string) => {        {(provided, snapshot) => (

    return orders.filter(order => order.status === status);          <div

  };            ref={provided.innerRef}

            {...provided.droppableProps}

  const handleDragEnd = async (result: any) => {            className={`flex-grow min-h-[200px] rounded-b-lg p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}

    if (!result.destination) return;          >

            {orders.map((order, index) => (

    const sourceStatus = result.source.droppableId;              <OrderCard key={order._id} order={order} index={index} />

    const destStatus = result.destination.droppableId;            ))}

                {provided.placeholder}

    if (sourceStatus === destStatus) return;            {orders.length === 0 && (

              <div className="text-center py-10 text-text-muted-light dark:text-text-muted-dark">

    const orderId = result.draggableId;                <div className="text-3xl mb-2">{config.icon}</div>

    const order = orders.find(o => o._id === orderId);                <p className="text-sm">No orders here</p>

                  </div>

    if (!order) return;            )}

          </div>

    try {        )}

      await apiFetch(`/api/orders/${orderId}`, {      </Droppable>

        method: 'PUT',    </div>

        body: { status: destStatus },  );

      });}

      

      mutate();export default function StaffOrdersPage() {

      toast.success(`Order moved to ${statusColumns[destStatus as keyof typeof statusColumns].title}`);  const [orders, setOrders] = useState<Order[]>([]);

    } catch (error: any) {  const [loading, setLoading] = useState(true);

      toast.error(error.message || 'Failed to update order');

    }  useEffect(() => {

  };    apiFetch<{ orders: Order[] }>(`/api/orders`)

      .then((res) => setOrders(res.orders))

  const getTimeAgo = (date: string) => {      .catch(() => toast.error("Failed to fetch orders."))

    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);      .finally(() => setLoading(false));

    if (minutes < 1) return 'Just now';

    if (minutes === 1) return '1 min ago';    const s = getSocket();

    if (minutes < 60) return `${minutes} min ago`;    const onOrderCreated = (payload: any) => {

    const hours = Math.floor(minutes / 60);      setOrders((prev) => [payload.order, ...prev]);

    if (hours === 1) return '1 hour ago';      toast.success(`New order #${payload.order._id.slice(-6)} received!`);

    return `${hours} hours ago`;    };

  };    const onOrderUpdated = (payload: any) => {

      setOrders((prev) => prev.map((o) => o._id === payload.order._id ? payload.order : o));

  return (    };

    <div className="flex w-full min-h-screen">    s.on('order:created', onOrderCreated);

      <main className="flex-1 flex flex-col h-screen overflow-hidden">    s.on('order:updated', onOrderUpdated);

        {/* Header */}    return () => {

        <header className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark">      s.off('order:created', onOrderCreated);

          <h1 className="text-2xl font-bold">Tuckshop Order Board</h1>      s.off('order:updated', onOrderUpdated);

          <div className="flex items-center gap-4">    };

            <button className="relative rounded-full p-2 text-text-muted-light dark:text-text-muted-dark hover:bg-surface-light dark:hover:bg-background-dark">  }, []);

              <span className="material-symbols-outlined">notifications</span>

              {orders.filter(o => o.status === 'pending').length > 0 && (  const groupedOrders = useMemo(() => {

                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600"></span>    const grouped: Record<OrderStatus, Order[]> = { placed: [], making: [], ready: [], delivering: [], completed: [] };

              )}    for (const order of orders) {

            </button>      if (grouped[order.status as OrderStatus]) {

            <div className="flex items-center gap-3">        grouped[order.status as OrderStatus].push(order);

              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">      }

                <span className="material-symbols-outlined text-primary">person</span>    }

              </div>    // Sort each group by creation date

              <div className="flex flex-col">    for (const status of STATUSES) {

                <h2 className="text-base font-medium">{user?.name}</h2>        grouped[status].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Tuckshop Staff</p>    }

              </div>    return grouped;

            </div>  }, [orders]);

          </div>

        </header>  const onDragEnd = async (result: DropResult) => {

    const { source, destination, draggableId } = result;

        {/* Kanban Board */}

        <DragDropContext onDragEnd={handleDragEnd}>    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 overflow-x-auto bg-background-light dark:bg-background-dark">      return;

            {Object.entries(statusColumns).map(([status, config]) => {    }

              const statusOrders = getOrdersByStatus(status);

                  const newStatus = destination.droppableId as OrderStatus;

              return (    const originalStatus = source.droppableId as OrderStatus;

                <div key={status} className="flex flex-col bg-gray-100 dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark min-w-[280px]">    

                  {/* Column Header */}    // Optimistic UI update

                  <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">    const movedOrder = orders.find(o => o._id === draggableId);

                    <h2 className={`font-bold ${config.textColor}`}>{config.title}</h2>    if (!movedOrder) return;

                    <span className={`px-2 py-1 text-sm font-semibold ${config.bgColor} ${config.textColor} rounded-full`}>

                      {statusOrders.length}    const newOrders = orders.map(o => o._id === draggableId ? { ...o, status: newStatus } : o);

                    </span>    setOrders(newOrders);

                  </div>

    try {

                  {/* Droppable Area */}      await apiFetch(`/api/orders/${draggableId}/status`, { method: 'PATCH', body: { status: newStatus } });

                  <Droppable droppableId={status}>      toast.success(`Order #${draggableId.slice(-6)} moved to ${STATUS_CONFIG[newStatus].label}`);

                    {(provided, snapshot) => (    } catch (error) {

                      <div      toast.error('Failed to update order status.');

                        ref={provided.innerRef}      // Revert on failure

                        {...provided.droppableProps}      setOrders(orders);

                        className={`flex-1 p-4 space-y-4 overflow-y-auto min-h-[200px] ${    }

                          snapshot.isDraggingOver ? 'bg-primary/5' : ''  };

                        }`}

                      >  return (

                        {statusOrders.map((order, index) => (    <RoleGate roles={["staff", "admin"]}>

                          <Draggable key={order._id} draggableId={order._id} index={index}>      <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">

                            {(provided, snapshot) => (        <div className="p-4 sm:p-6 lg:p-8 flex-shrink-0">

                              <div          <h1 className="text-4xl font-black tracking-tight">Order Dashboard</h1>

                                ref={provided.innerRef}        </div>

                                {...provided.draggableProps}

                                {...provided.dragHandleProps}        {loading ? (

                                className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow cursor-grab active:cursor-grabbing ${          <div className="flex-1 flex items-center justify-center"><div className="loader"></div></div>

                                  status === 'completed' ? 'opacity-70' : ''        ) : (

                                } ${snapshot.isDragging ? 'shadow-xl ring-2 ring-primary' : ''}`}          <DragDropContext onDragEnd={onDragEnd}>

                              >            <div className="flex-1 flex gap-6 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4">

                                {/* Order Header */}              {STATUSES.map((status) => (

                                <div className="flex justify-between items-start mb-2">                <OrderColumn key={status} status={status} orders={groupedOrders[status]} />

                                  <p className={`font-bold ${status === 'completed' ? 'text-gray-600 dark:text-gray-400' : ''}`}>              ))}

                                    #{order.orderNumber}            </div>

                                  </p>          </DragDropContext>

                                  <span className="text-xs text-text-muted-light dark:text-text-muted-dark">        )}

                                    {getTimeAgo(order.createdAt)}      </div>

                                  </span>    </RoleGate>

                                </div>  );

}

                                {/* Order Items */}
                                <div className={`space-y-1 text-sm ${status === 'completed' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {order.items.map((item, idx) => (
                                    <p key={idx}>
                                      {item.quantity}x {item.item.name}
                                    </p>
                                  ))}
                                </div>

                                {/* Order Footer */}
                                <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark flex items-center justify-between">
                                  <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                    {order.user.name}
                                  </span>
                                  <span className="text-sm font-bold text-primary">
                                    ₹{order.total.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {statusOrders.length === 0 && (
                          <div className="flex items-center justify-center h-32 text-text-muted-light dark:text-text-muted-dark text-sm">
                            No orders
                          </div>
                        )}
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
