"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { RoleGate } from '@/components/RoleGate';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<string, string> = {
  student: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  staff: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  runner: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  admin: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  async function refresh() {
    try {
      const res = await apiFetch<{ users: any[] }>(`/api/admin/users`);
      setUsers(res.users);
    } catch (error) {
      toast.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function setRole(id: string, role: string) {
    const originalUsers = [...users];
    const optimisticUpdate = users.map(u => u._id === id ? { ...u, role } : u);
    setUsers(optimisticUpdate);

    try {
      await apiFetch(`/api/admin/users/${id}/role`, { method: 'PATCH', body: { role } });
      toast.success(`User role updated to ${role}.`);
    } catch (error) {
      toast.error("Failed to update user role.");
      setUsers(originalUsers); // Revert on failure
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <RoleGate roles={["admin"]}>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-4xl font-black tracking-tight">User Management</h1>
          <div className="relative w-full max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark">
              search
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><div className="loader"></div></div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
                    <th className="p-4 text-left text-sm font-semibold text-text-muted-light dark:text-text-muted-dark">User</th>
                    <th className="p-4 text-left text-sm font-semibold text-text-muted-light dark:text-text-muted-dark">Role</th>
                    <th className="p-4 text-left text-sm font-semibold text-text-muted-light dark:text-text-muted-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="border-b border-border-light dark:border-border-dark last:border-b-0 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-sm text-text-muted-light dark:text-text-muted-dark">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[u.role] || 'bg-gray-500/10 text-gray-500'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          className="input h-9 text-sm"
                          defaultValue={u.role}
                          onChange={(e) => setRole(u._id, e.target.value)}
                        >
                          {['student', 'staff', 'runner', 'admin'].map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </RoleGate>
  );
}
