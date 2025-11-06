"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useCart } from '@/components/CartProvider';
import { getSocket } from '@/lib/socket';

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const { add } = useCart();

  useEffect(() => {
    apiFetch<{ items: any[] }>(`/api/menu`).then((res) => setItems(res.items));
    apiFetch<{ categories: any[] }>(`/api/categories`).then((res) => setCategories(res.categories));
    const s = getSocket();
    const onStock = (p:any) => {
      setItems((prev)=> prev.map((it)=> it._id===p.itemId ? { ...it, available: p.available, stock: p.stock } : it));
    };
    s.on('stock:updated', onStock);
    return () => { s.off('stock:updated', onStock); };
  }, []);

  // Filter and search - Pattern from Mshandev's "Filter Food Products" feature
  const shown = items.filter((i) => {
    const matchesCategory = filter === 'all' || i.category === filter;
    const matchesSearch = search === '' || i.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header with search and filter - Inspired by ev0clu's dynamic menu UI */}
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Menu</h1>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setFilter(c.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === c.name
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-slate-600">
        Showing {shown.length} {shown.length === 1 ? 'item' : 'items'}
      </div>

      {/* Menu Grid - Enhanced responsive layout inspired by Foodeli's mobile-first design */}
      {shown.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500 text-lg">No items found matching your criteria.</p>
          <button onClick={() => { setSearch(''); setFilter('all'); }} className="btn mt-4">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shown.map((item) => (
            <div key={item._id} className="card hover:shadow-xl transition-shadow overflow-hidden">
              {/* Image placeholder - Pattern from DulanjaliSenarathna's app */}
              <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                <svg className="w-20 h-20 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-slate-900">{item.name}</h3>
                  <span className="text-lg font-bold text-orange-600">₹{item.price}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  {item.category && (
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {item.category}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    item.available 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {item.available ? (item.stock ? `Stock: ${item.stock}` : 'Available') : 'Out of Stock'}
                  </span>
                </div>
                
                <button
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    item.available
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  disabled={!item.available}
                  onClick={() => add({ itemId: item._id, name: item.name, price: item.price, qty: 1 })}
                >
                  {item.available ? 'Add to Cart' : 'Unavailable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
