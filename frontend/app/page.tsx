"use client";
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      icon: '???',
      title: 'Lightning Fast',
      description: 'Order in seconds and skip the queue. Your time is precious.',
      color: 'from-yellow-500/20 to-orange-500/20',
    },
    {
      icon: '????',
      title: 'Real-Time Tracking',
      description: 'Watch your order progress from kitchen to your hands, live.',
      color: 'from-blue-500/20 to-purple-500/20',
    },
    {
      icon: '????',
      title: 'Smart Menu',
      description: 'See whats available right now with live stock updates.',
      color: 'from-green-500/20 to-emerald-500/20',
    },
  ];

  const popularItems = [
    {
      name: 'Classic Beef Burger',
      price: '5.50',
      image: '????',
      badge: 'Bestseller',
    },
    {
      name: 'Spicy Chicken Wrap',
      price: '6.20',
      image: '????',
      badge: 'Hot',
    },
    {
      name: 'Chocolate Shake',
      price: '4.00',
      image: '????',
      badge: 'Popular',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Glassy Effect */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-background-dark dark:via-surface-dark dark:to-background-dark">
        {/* Decorative Blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl"></div>
        
        <div className="container relative z-10 py-20 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <span className="text-2xl">????</span>
              <span className="text-sm font-semibold text-primary">Campus Grub</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6">
              <span className="bg-gradient-to-r from-primary via-orange-600 to-amber-600 bg-clip-text text-transparent">
                Your Campus
              </span>
              <br />
              <span className="text-text-light dark:text-text-dark">
                Food Hub
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-text-muted-light dark:text-text-muted-dark mb-8 max-w-2xl mx-auto">
              Skip the queue, order ahead, and track your food in real-time. 
              The smartest way to order from your tuckshop.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link
                    href="/menu"
                    className="btn btn-primary text-lg px-8 py-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all"
                  >
                    Browse Menu ???
                  </Link>
                  <Link
                    href="/orders"
                    className="btn bg-surface-light dark:bg-surface-dark border-2 border-border-light dark:border-border-dark text-lg px-8 py-4 hover:border-primary hover:text-primary transition-all"
                  >
                    My Orders
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="btn btn-primary text-lg px-8 py-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/menu"
                    className="btn bg-surface-light dark:bg-surface-dark border-2 border-border-light dark:border-border-dark text-lg px-8 py-4 hover:border-primary hover:text-primary transition-all"
                  >
                    View Menu
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              {[
                { label: 'Students', value: '1000+' },
                { label: 'Orders Today', value: '250+' },
                { label: 'Avg Time', value: '5 min' },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-xl p-4">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-text-muted-light dark:text-text-muted-dark">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 container">
        <h2 className="text-4xl font-black text-center mb-4">Why Students Love Us</h2>
        <p className="text-center text-text-muted-light dark:text-text-muted-dark mb-12 max-w-2xl mx-auto">
          Built specifically for busy students who need quick, reliable food ordering
        </p>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group glass rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Items */}
      <section className="py-20 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-surface-dark/50 dark:to-background-dark">
        <div className="container">
          <h2 className="text-4xl font-black text-center mb-4">Today's Favorites</h2>
          <p className="text-center text-text-muted-light dark:text-text-muted-dark mb-12">
            What everyone's ordering right now
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {popularItems.map((item) => (
              <div
                key={item.name}
                className="glass rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 group cursor-pointer"
              >
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 flex items-center justify-center text-8xl group-hover:scale-110 transition-transform">
                    {item.image}
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-lg">
                      {item.badge}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold">{item.name}</h3>
                    <span className="text-2xl font-bold text-primary">${item.price}</span>
                  </div>
                  <Link
                    href="/menu"
                    className="btn btn-primary w-full"
                  >
                    Order Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 container">
        <div className="glass rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-orange-500/10 to-amber-500/10"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-4">Ready to order?</h2>
            <p className="text-xl text-text-muted-light dark:text-text-muted-dark mb-8 max-w-2xl mx-auto">
              Join hundreds of students already enjoying hassle-free tuckshop ordering
            </p>
            <Link
              href={user ? "/menu" : "/auth/login"}
              className="btn btn-primary text-lg px-10 py-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              {user ? "Order Now" : "Sign Up Free"}
              <span>???</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
