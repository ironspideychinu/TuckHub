"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { RoleGate } from '@/components/RoleGate';
import toast from 'react-hot-toast';

// Modal for Adding/Editing Items
function ItemModal({ item, categories, onClose, onSave }: { item: any | null, categories: any[], onClose: () => void, onSave: (itemData: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    image: '',
    ...item
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold">{item ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" placeholder="e.g. Classic Burger" required />
            </div>
            <div className="form-control">
              <label className="label">Price</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} className="input" placeholder="e.g. 150" required />
            </div>
          </div>

          <div className="form-control">
            <label className="label">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="input" placeholder="A short description of the item..."></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="input" required>
                <option value="" disabled>Select a category</option>
                {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label">Image Emoji/URL</label>
              <input type="text" name="image" value={formData.image} onChange={handleChange} className="input" placeholder="🍔 or https://..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary h-11 px-5">Cancel</button>
            <button type="submit" className="btn-primary h-11 px-5">{item ? 'Save Changes' : 'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function StaffMenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      const [itemsRes, categoriesRes] = await Promise.all([
        apiFetch<{ items: any[] }>(`/api/menu`),
        apiFetch<{ categories: any[] }>(`/api/categories`),
      ]);
      setItems(itemsRes.items);
      setCategories(categoriesRes.categories);
    } catch (error) {
      toast.error("Failed to fetch menu data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const handleSaveItem = async (itemData: any) => {
    const isEditing = !!itemData._id;
    const url = isEditing ? `/api/menu/${itemData._id}` : '/api/menu';
    const method = isEditing ? 'PATCH' : 'POST';

    try {
      await apiFetch(url, { method, body: itemData });
      toast.success(`Item ${isEditing ? 'updated' : 'added'} successfully!`);
      setIsModalOpen(false);
      setEditingItem(null);
      refresh();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'add'} item.`);
    }
  };

  const handleToggleAvailability = async (id: string, available: boolean) => {
    try {
      await apiFetch(`/api/menu/${id}`, { method: 'PATCH', body: { available } });
      toast.success(`Availability updated.`);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update availability.');
    }
  };

  const handleUpdateStock = async (id: string, stock: number) => {
    try {
      await apiFetch(`/api/menu/${id}`, { method: 'PATCH', body: { stock } });
      toast.success(`Stock updated.`);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stock.');
    }
  };
  
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    try {
      await apiFetch(`/api/menu/${id}`, { method: 'DELETE' });
      toast.success('Item deleted successfully.');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item.');
    }
  }

  return (
    <RoleGate roles={["staff", "admin"]}>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-4xl font-black tracking-tight">Menu Management</h1>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2 h-11 px-5">
            <span className="material-symbols-outlined">add</span>
            Add New Item
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="loader"></div></div>
        ) : (
          <div className="grid grid-cols-1 @lg:grid-cols-2 @4xl:grid-cols-3 gap-6">
            {items.map((it) => (
              <div key={it._id} className="card flex flex-col justify-between gap-4">
                <div className="flex gap-4">
                  <div className="size-20 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
                    {it.image || '🍔'}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-lg">{it.name}</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${it.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {it.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="text-primary font-bold">₹{it.price}</p>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">{it.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-border-light dark:border-border-dark">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Stock:</label>
                    <input 
                      type="number" 
                      className="input w-20 h-9 text-center" 
                      defaultValue={it.stock ?? 0} 
                      onBlur={(e) => handleUpdateStock(it._id, Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleAvailability(it._id, !it.available)} className="btn-secondary h-9 px-3 text-sm">
                      {it.available ? 'Set Unavailable' : 'Set Available'}
                    </button>
                    <button onClick={() => { setEditingItem(it); setIsModalOpen(true); }} className="btn-secondary h-9 w-9 flex items-center justify-center">
                      <span className="material-symbols-outlined !text-xl">edit</span>
                    </button>
                     <button onClick={() => handleDeleteItem(it._id)} className="btn-secondary h-9 w-9 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500">
                      <span className="material-symbols-outlined !text-xl">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && <ItemModal item={editingItem} categories={categories} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} />}
    </RoleGate>
  );
}
