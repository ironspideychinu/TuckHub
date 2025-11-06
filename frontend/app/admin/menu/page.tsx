"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { RoleGate } from '@/components/RoleGate';

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCat, setNewCat] = useState('');

  async function refresh() {
    const res = await apiFetch<{ categories: any[] }>(`/api/categories`);
    setCategories(res.categories);
  }
  useEffect(()=>{ refresh(); },[]);

  async function addCategory(){
    if (!newCat.trim()) return;
    await apiFetch(`/api/categories`, { method: 'POST', body: { name: newCat.trim() } });
    setNewCat('');
    refresh();
  }
  async function renameCategory(id: string, name: string){
    await apiFetch(`/api/categories/${id}`, { method: 'PATCH', body: { name } });
    refresh();
  }
  async function deleteCategory(id: string){
    await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <RoleGate roles={["admin"]}>
    <div className="space-y-4">
      <div className="card flex gap-2">
        <input className="border rounded px-3 py-2" placeholder="New category" value={newCat} onChange={(e)=>setNewCat(e.target.value)} />
        <button className="btn" onClick={addCategory}>Add</button>
      </div>
      <div className="card">
        <div className="font-semibold mb-2">Categories</div>
        <ul className="space-y-2">
          {categories.map((c)=> (
            <li key={c._id} className="flex items-center gap-2">
              <input className="border rounded px-2 py-1" defaultValue={c.name} onBlur={(e)=>renameCategory(c._id, e.target.value)} />
              <button className="text-red-600" onClick={()=>deleteCategory(c._id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </RoleGate>
  );
}
