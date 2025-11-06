"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { RoleGate } from '@/components/RoleGate';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  async function refresh(){
    const res = await apiFetch<{ users: any[] }>(`/api/admin/users`);
    setUsers(res.users);
  }
  useEffect(()=>{ refresh(); },[]);

  async function setRole(id: string, role: string){
    await apiFetch(`/api/admin/users/${id}/role`, { method: 'PATCH', body: { role } });
    refresh();
  }

  return (
    <RoleGate roles={["admin"]}>
    <div className="space-y-3">
      {users.map((u)=> (
        <div key={u._id} className="card flex items-center justify-between">
          <div>
            <div className="font-medium">{u.name}</div>
            <div className="text-sm text-slate-600">{u.email}</div>
          </div>
          <select className="border rounded px-2 py-1" defaultValue={u.role} onChange={(e)=>setRole(u._id, e.target.value)}>
            {['student','staff','runner','admin'].map((r)=> <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      ))}
    </div>
    </RoleGate>
  );
}
