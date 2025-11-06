"use client";
import React from 'react';
import { useAuth } from '@/components/AuthProvider';

export function RoleGate({ roles, children }: { roles: Array<'student'|'staff'|'runner'|'admin'>; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <p>Please login to access this page.</p>;
  if (!roles.includes(user.role)) return <p>Insufficient permissions.</p>;
  return <>{children}</>;
}
