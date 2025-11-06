"use client";
import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import useSWR, { mutate } from 'swr';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: { _id: string; name: string };
  available: boolean;
  image?: string;
}

interface Category {
  _id: string;
  name: string;
}

export default function StaffMenuPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    available: true,
  });

  const { data: menuItems } = useSWR<MenuItem[]>('/api/menu', apiFetch);
  const { data: categories } = useSWR<Category[]>('/api/categories', apiFetch);

  if (user?.role !== 'staff' && user?.role !== 'admin') {
    router.push('/');
    return null;
  }

  const filteredItems = menuItems?.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingItem ? `/api/menu/${editingItem._id}` : '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';
      
      await apiFetch(endpoint, {
        method,
        body: { ...formData, price: parseFloat(formData.price) },
      });

      mutate('/api/menu');
      toast.success(editingItem ? 'Item updated successfully!' : 'Item added successfully!');
      setShowAddModal(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', category: '', available: true });
    } catch (error: any) {
      toast.error(error.message || 'Failed to save item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await apiFetch(`/api/menu/${id}`, { method: 'DELETE' });
      mutate('/api/menu');
      toast.success('Item deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category._id,
      available: item.available,
    });
    setShowAddModal(true);
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await apiFetch(`/api/menu/${item._id}`, {
        method: 'PUT',
        body: { available: !item.available },
      });
      mutate('/api/menu');
      toast.success(`${item.name} is now ${!item.available ? 'available' : 'unavailable'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update availability');
    }
  };

  return (
    <main className="flex-1">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Menu Management</h1>
            <p className="text-text-muted-light dark:text-text-muted-dark mt-1 text-base">
              Add, edit, and manage all items available in the tuckshop.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({ name: '', description: '', price: '', category: '', available: true });
              setShowAddModal(true);
            }}
            className="btn-primary h-10 px-4 rounded-lg font-bold inline-flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add New Item
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-grow min-w-[240px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <span className="material-symbols-outlined text-xl text-text-muted-light dark:text-text-muted-dark">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name..."
                className="w-full h-11 pl-12 pr-4 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex h-9 shrink-0 items-center justify-center px-3 rounded-lg text-sm font-medium ${
                selectedCategory === 'all'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              All
            </button>
            {categories?.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex h-9 shrink-0 items-center justify-center px-3 rounded-lg text-sm font-medium ${
                  selectedCategory === cat.name
                    ? 'bg-primary/20 text-primary'
                    : 'bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
                    Availability
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark bg-white dark:bg-surface-dark">
                {filteredItems?.map((item) => (
                  <tr key={item._id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-10 flex-shrink-0 rounded-lg bg-surface-light dark:bg-background-dark overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🍔</div>
                          )}
                        </div>
                        <div className="text-sm font-medium">{item.name}</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-text-muted-light dark:text-text-muted-dark">
                      {item.category.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-text-muted-light dark:text-text-muted-dark">
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={item.available}
                          onChange={() => toggleAvailability(item)}
                          className="sr-only peer"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800"></div>
                      </label>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-text-muted-light dark:text-text-muted-dark hover:text-primary"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-text-muted-light dark:text-text-muted-dark hover:text-red-600"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredItems?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-bold mb-2">No items found</h3>
            <p className="text-text-muted-light dark:text-text-muted-dark">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first menu item to get started'}
            </p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass max-w-md w-full rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="size-10 flex items-center justify-center rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories?.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="size-5 rounded border-border-light dark:border-border-dark"
                  />
                  <label htmlFor="available" className="text-sm font-medium">
                    Available for purchase
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-12 rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark font-medium"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary h-12 rounded-lg font-bold">
                    {editingItem ? 'Update' : 'Add'} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
