"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useCart } from './CartProvider';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Avoid any theme/pathname/client-only mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  const navLinks = user ? [
    { href: '/menu', label: 'Menu', icon: 'restaurant_menu', roles: ['student', 'staff', 'runner', 'admin'] },
    { href: '/cart', label: 'Cart', icon: 'shopping_cart', roles: ['student'] },
    { href: '/orders', label: 'My Orders', icon: 'receipt_long', roles: ['student'] },
    { href: '/staff/orders', label: 'Orders', icon: 'view_kanban', roles: ['staff', 'admin'] },
    { href: '/staff/menu', label: 'Manage Menu', icon: 'inventory_2', roles: ['staff', 'admin'] },
    { href: '/runner/tasks', label: 'Deliveries', icon: 'two_wheeler', roles: ['runner'] },
    { href: '/admin/reports', label: 'Reports', icon: 'stacked_bar_chart', roles: ['admin'] },
    { href: '/admin/users', label: 'Users', icon: 'group', roles: ['admin'] },
    { href: '/admin/menu', label: 'Categories', icon: 'category', roles: ['admin'] },
  ].filter(link => link.roles.includes(user.role)) : [];

  // Render a stable header even before mounted to avoid hydration mismatches
  return (
    <header className="sticky top-0 z-50 glass border-b border-border-light dark:border-border-dark">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">restaurant</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent hidden sm:block">
              TuckHub
            </span>
          </Link>

          {mounted && user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === link.href
                      ? 'bg-primary/20 text-primary'
                      : 'text-text-muted-light dark:text-text-muted-dark hover:bg-border-light dark:hover:bg-border-dark'
                  }`}
                >
                  <span className="material-symbols-outlined !text-base" aria-hidden>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {mounted && user ? (
              <>
                {user.role === 'student' && (
                  <Link
                    href="/cart"
                    className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-border-light dark:bg-border-dark hover:bg-border-light/80 dark:hover:bg-border-dark/80 transition-colors"
                  >
                    <span className="material-symbols-outlined">shopping_cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="flex items-center gap-3 pl-3 border-l border-border-light dark:border-border-dark">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark capitalize">{user.role}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-orange-600/20 rounded-full flex items-center justify-center font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="btn btn-primary px-6"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
