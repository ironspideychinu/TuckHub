"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type User = { id: string; name: string; email: string; role: 'student'|'staff'|'runner'|'admin' }

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      setToken(t);
      apiFetch<{ user: User }>(`/api/auth/me`, { token: t }).then((res) => setUser(res.user)).catch(() => {});
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await apiFetch<{ token: string; user: User }>(`/api/auth/login`, { method: 'POST', body: { email, password } });
    localStorage.setItem('token', res.token);
    localStorage.setItem('userId', res.user.id);
    setToken(res.token);
    setUser(res.user);
  }

  async function register(name: string, email: string, password: string) {
    const res = await apiFetch<{ token: string; user: User }>(`/api/auth/register`, { method: 'POST', body: { name, email, password } });
    localStorage.setItem('token', res.token);
    localStorage.setItem('userId', res.user.id);
    setToken(res.token);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, token, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
