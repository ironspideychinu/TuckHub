"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { RoleGate } from '@/components/RoleGate';
import toast from 'react-hot-toast';

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCat, setNewCat] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await apiFetch<{ categories: any[] }>(`/api/categories`);
      setCategories(res.categories);
    } catch (error) {
      toast.error("Failed to fetch categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCat.trim()) return;
    
    const optimisticId = `temp-${Date.now()}`;
    const newCategory = { _id: optimisticId, name: newCat.trim(), isOptimistic: true };
    setCategories(prev => [...prev, newCategory]);
    setNewCat('');

    try {
      await apiFetch(`/api/categories`, { method: 'POST', body: { name: newCat.trim() } });
      toast.success("Category added!");
      refresh(); // Refresh to get the real ID
    } catch (error) {
      toast.error("Failed to add category.");
      setCategories(prev => prev.filter(c => c._id !== optimisticId));
    }
  }

  async function renameCategory(id: string, name: string) {
    if (!name.trim()) {
      toast.error("Category name cannot be empty.");
      refresh(); // Revert to original name
      return;
    }
    try {
      await apiFetch(`/api/categories/${id}`, { method: 'PATCH', body: { name } });
      toast.success("Category renamed.");
    } catch (error) {
      toast.error("Failed to rename category.");
      refresh();
    }
  }

  async function deleteCategory(id: string) {
    const originalCategories = [...categories];
    setCategories(prev => prev.filter(c => c._id !== id));
    
    try {
      await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
      toast.success("Category deleted.");
    } catch (error) {
      toast.error("Failed to delete category.");
      setCategories(originalCategories);
    }
  }

  return (
    <RoleGate roles={["admin"]}>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-4xl font-black tracking-tight">Manage Categories</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={addCategory} className="card flex items-center gap-3 p-4 mb-6">
            <input
              className="input flex-grow"
              placeholder="Enter new category name..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
            <button type="submit" className="btn-primary h-11 shrink-0">
              <span className="material-symbols-outlined mr-2">add_circle</span>
              Add Category
            </button>
          </form>

          {loading ? (
            <div className="flex-1 flex items-center justify-center"><div className="loader"></div></div>
          ) : (
            <div className="card p-4">
              <h2 className="text-lg font-bold mb-4">Existing Categories ({categories.length})</h2>
              <div className="space-y-3">
                {categories.map((c) => (
                  <div
                    key={c._id}
                    className={`flex items-center gap-3 p-3 rounded-lg bg-surface-light dark:bg-surface-dark transition-opacity ${c.isOptimistic ? 'opacity-50' : 'opacity-100'}`}
                  >
                    <span className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark">
                      sell
                    </span>
                    <input
                      className="flex-grow bg-transparent font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1 -m-1"
                      defaultValue={c.name}
                      onBlur={(e) => renameCategory(c._id, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      disabled={c.isOptimistic}
                    />
                    <button
                      className="text-text-muted-light dark:text-text-muted-dark hover:text-red-500 transition-colors"
                      onClick={() => deleteCategory(c._id)}
                      disabled={c.isOptimistic}
                      aria-label="Delete category"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
              {categories.length === 0 && !loading && (
                <div className="text-center py-10">
                  <p className="text-text-muted-light dark:text-text-muted-dark">No categories found. Add one above to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </RoleGate>
  );
}
