"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { RoleGate } from '@/components/RoleGate';

export default function AdminReportsPage() {
  const [data, setData] = useState<any | null>(null);
  useEffect(() => {
    apiFetch(`/api/admin/reports`).then(setData as any);
  }, []);

  if (!data) return <RoleGate roles={["admin"]}><p>Loading...</p></RoleGate>;

  return (
    <RoleGate roles={["admin"]}>
    <div className="space-y-4">
      <div className="card">
        <div className="font-semibold mb-2">Totals</div>
        <div>Total sales: ₹{data.totalSales.totalSales} • Orders: {data.totalSales.orders}</div>
      </div>
      <div className="card">
        <div className="font-semibold mb-2">Item-wise sales</div>
        <ul className="list-disc pl-5">
          {data.itemWise.map((it:any)=> (
            <li key={it._id}>{it._id}: {it.qty} items • ₹{it.revenue}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <div className="font-semibold mb-2">Busiest hours</div>
        <ul className="list-disc pl-5">
          {data.busiestByHour.map((b:any)=> (
            <li key={b._id}>Hour {b._id}: {b.count} orders</li>
          ))}
        </ul>
      </div>
    </div>
    </RoleGate>
  );
}
