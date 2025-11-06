"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { RoleGate } from '@/components/RoleGate';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm rounded-lg shadow-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark">
        <p className="label font-bold">{`Hour: ${label}:00`}</p>
        <p className="intro text-primary">{`Orders: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const SalesTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 text-sm rounded-lg shadow-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark">
        <p className="label font-bold">{format(new Date(label), 'MMM d')}</p>
        <p className="intro text-primary">{`Sales: ₹${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};


export default function AdminReportsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getReports() {
      try {
        const reportData = await apiFetch(`/api/admin/reports`);
        setData(reportData);
      } catch (error) {
        toast.error("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    }
    getReports();
  }, []);

  const averageOrderValue = data?.totalSales.orders > 0
    ? (data.totalSales.totalSales / data.totalSales.orders)
    : 0;

  if (loading) {
    return (
      <RoleGate roles={["admin"]}>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex-1 flex items-center justify-center h-full"><div className="loader"></div></div>
        </main>
      </RoleGate>
    );
  }

  if (!data) {
    return (
      <RoleGate roles={["admin"]}>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 text-center">
          <p>Could not load report data.</p>
        </main>
      </RoleGate>
    );
  }

  return (
    <RoleGate roles={["admin"]}>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <h1 className="text-4xl font-black tracking-tight mb-6">Reports & Analytics</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 @lg:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">account_balance_wallet</span>
              </div>
              <div>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Total Revenue</p>
                <p className="text-2xl font-bold">₹{data.totalSales.totalSales?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">shopping_cart</span>
              </div>
              <div>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Total Orders</p>
                <p className="text-2xl font-bold">{data.totalSales.orders || 0}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">request_quote</span>
              </div>
              <div>
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Average Order Value</p>
                <p className="text-2xl font-bold">₹{averageOrderValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 @5xl:grid-cols-3 gap-6">
          {/* Sales Over Time & Top Selling Items */}
          <div className="card @5xl:col-span-2 p-6">
            <h2 className="text-lg font-bold mb-4">Sales Over Last 30 Days</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.salesByDay} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="_id" tickFormatter={(val) => format(new Date(val), 'MMM d')} fontSize={12} tick={{ fill: 'var(--text-muted-color)' }} />
                  <YAxis fontSize={12} tick={{ fill: 'var(--text-muted-color)' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip content={<SalesTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="totalSales" name="Sales" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold mb-4">Top Selling Items</h2>
            {data.itemWise.length > 0 ? (
              <div className="space-y-4">
                {data.itemWise.slice(0, 5).map((item: any, idx: number) => (
                  <div key={item._id} className="flex items-center gap-4">
                    <div className="size-8 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center font-bold text-primary">{idx + 1}</div>
                    <div className="flex-grow">
                      <p className="font-medium truncate">{item._id}</p>
                      <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{item.qty} units sold</p>
                    </div>
                    <p className="font-bold">₹{item.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted-light dark:text-text-muted-dark">No sales data yet.</div>
            )}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="card p-6 mt-6">
          <h2 className="text-lg font-bold mb-4">Peak Order Hours</h2>
          {data.busiestByHour.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.busiestByHour} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="_id" fontSize={12} tickFormatter={(val) => `${val}:00`} tick={{ fill: 'var(--text-muted-color)' }} />
                  <YAxis fontSize={12} tick={{ fill: 'var(--text-muted-color)' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-color)' }} />
                  <Bar dataKey="count" name="Orders" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted-light dark:text-text-muted-dark">No hourly data yet.</div>
          )}
        </div>
      </main>
    </RoleGate>
  );
}
