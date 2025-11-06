"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

function LoginPageInner() {
  const { login } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = sp?.get('token');
    const error = sp?.get('error');
    if (token) {
      localStorage.setItem('token', token);
      toast.success('Logged in successfully!');
      router.replace('/menu');
    }
    if(error) {
      toast.error(error);
    }
  }, [sp, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push('/menu');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* Left Side - Image */}
      <div 
        className="hidden md:flex flex-1 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80")'
        }}
      />

      {/* Right Side - Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 bg-background-light dark:bg-background-dark">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-start gap-3 mb-6">
            <div className="bg-primary text-white flex h-12 w-12 items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-3xl">fastfood</span>
            </div>
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Campus Eats</h2>
          </div>

          {/* Heading */}
          <h1 className="text-text-light dark:text-text-dark tracking-tight text-[32px] font-bold leading-tight text-left pb-1 pt-6">
            Welcome Back
          </h1>
          <p className="text-text-muted-light dark:text-text-muted-dark text-base font-normal leading-normal pb-8">
            Log in to continue to your account.
          </p>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col">
              <label className="flex flex-col w-full">
                <p className="text-text-light dark:text-text-dark text-base font-medium leading-normal pb-2">
                  Email / Student ID
                </p>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or student ID"
                  className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark focus:border-primary h-14 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark p-[15px] text-base font-normal leading-normal"
                  required
                />
              </label>
            </div>

            {/* Password Field */}
            <div className="flex flex-col">
              <label className="flex flex-col w-full">
                <div className="flex justify-between items-center pb-2">
                  <p className="text-text-light dark:text-text-dark text-base font-medium leading-normal">
                    Password
                  </p>
                  <a className="text-primary text-sm font-medium hover:underline" href="#">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative flex w-full flex-1 items-stretch">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark focus:border-primary h-14 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark p-[15px] pr-12 text-base font-normal leading-normal"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="text-text-muted-light dark:text-text-muted-dark absolute right-0 top-0 flex h-full items-center justify-center px-4 hover:text-text-light dark:hover:text-text-dark"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center font-semibold text-base text-white h-14 w-full rounded-lg bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-background-dark mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 py-6">
            <div className="flex-1 h-px bg-border-light dark:bg-border-dark"></div>
            <span className="text-sm text-text-muted-light dark:text-text-muted-dark">OR</span>
            <div className="flex-1 h-px bg-border-light dark:bg-border-dark"></div>
          </div>

          {/* Microsoft Login */}
          <a
            href={`${API_BASE.replace(/\/$/, '')}/auth/microsoft`}
            className="flex items-center justify-center gap-3 font-medium text-base text-text-light dark:text-text-dark h-14 w-full rounded-lg border-2 border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23">
              <path fill="#f35325" d="M0 0h11v11H0z"/>
              <path fill="#81bc06" d="M12 0h11v11H12z"/>
              <path fill="#05a6f0" d="M0 12h11v11H0z"/>
              <path fill="#ffba08" d="M12 12h11v11H12z"/>
            </svg>
            Continue with Microsoft
          </a>

          {/* Register Link */}
          <p className="text-center text-sm text-text-muted-light dark:text-text-muted-dark pt-8">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Register Here
            </Link>
          </p>
          <p className="text-center text-xs text-text-muted-light dark:text-text-muted-dark mt-2">
            (Students must use Microsoft sign-in)
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex w-full min-h-screen items-center justify-center">
        <div className="loader"></div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}

