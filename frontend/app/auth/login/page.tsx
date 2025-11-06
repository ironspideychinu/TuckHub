"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE } from '@/lib/api';

function LoginPageInner() {
  const { login } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sp?.get('token');
    if (token) {
      localStorage.setItem('token', token);
      router.replace('/menu');
    }
  }, [sp, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/menu');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  }

  return (
    <div className="max-w-sm mx-auto card">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn" type="submit">Login</button>
      </form>
      <div className="mt-4">
        <a className="btn" href={`${API_BASE.replace(/\/$/, '')}/auth/microsoft`}>
          Sign in with Microsoft
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-sm mx-auto card">Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
