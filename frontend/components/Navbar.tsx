"use client";
import Link from 'next/link';
import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ShoppingCartIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-30">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-4">
          <Link href="/menu" className="font-semibold text-lg">TuckHub</Link>
          <nav className="hidden md:flex gap-4 text-sm text-slate-700">
            <Link href="/menu" className="hover:text-slate-900">Menu</Link>
            <Link href="/orders" className="hover:text-slate-900">Orders</Link>
            {user?.role === 'staff' || user?.role === 'admin' ? (
              <>
                <Link href="/staff/orders" className="hover:text-slate-900">Staff Orders</Link>
                <Link href="/staff/menu" className="hover:text-slate-900">Staff Menu</Link>
              </>
            ) : null}
            {user?.role === 'runner' ? (
              <Link href="/runner/tasks" className="hover:text-slate-900">Runner Tasks</Link>
            ) : null}
            {user?.role === 'admin' ? (
              <>
                <Link href="/admin/users" className="hover:text-slate-900">Users</Link>
                <Link href="/admin/menu" className="hover:text-slate-900">Admin Menu</Link>
                <Link href="/admin/reports" className="hover:text-slate-900">Reports</Link>
              </>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cart" className="inline-flex items-center gap-1 text-sm">
            <ShoppingCartIcon className="h-5 w-5" /> Cart
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1 text-sm text-slate-700">
                <UserCircleIcon className="h-5 w-5" /> {user.name}
                <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 text-xs capitalize">{user.role}</span>
              </span>
              <button onClick={logout} className="btn">Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Link className="btn" href="/auth/login">Login</Link>
              <Link className="hidden sm:block text-slate-700 hover:text-slate-900" href="/auth/register">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
