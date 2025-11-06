export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function apiFetch<T = any>(path: string, opts: { method?: HttpMethod; body?: any; token?: string } = {}): Promise<T> {
  const token = opts.token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as T;
}
