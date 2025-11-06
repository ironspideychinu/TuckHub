# TuckHub
Smart Campus Tuckshop Ordering & Management System

## Stack
- Frontend: Next.js (App Router) + TailwindCSS + Socket.io client
- Backend: Express.js + MongoDB (Mongoose) + Socket.io
- Auth: JWT (Bearer), bcrypt passwords

## Features
- Roles: student, staff, runner, admin (RBAC)
- Menu management with availability & stock
- Cart & checkout
- Realtime order events: created, updated, stock updated, runner assigned
- Multi-role dashboards
- Order history with status timeline
- Admin reports: totals, item-wise, busiest hours

## Quick start (Linux, zsh)

1) Backend env

Copy and edit env file:

```
cp backend/.env.example backend/.env
```

Ensure MongoDB is running and update `MONGODB_URI` if needed.

2) Install deps

```
cd backend && npm install
cd ../frontend && npm install
```

3) Run servers

In two terminals:

```
cd backend && npm run dev
```

```
cd frontend && npm run dev
```

Frontend: http://localhost:3000

4) Configure frontend env (optional)

```
cp frontend/.env.example frontend/.env
```

If backend runs on a different port/host, set `NEXT_PUBLIC_API_URL` accordingly.

## API overview

- Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- Menu: GET /api/menu, POST /api/menu (admin), PATCH /api/menu/:id, DELETE /api/menu/:id
- Orders: POST /api/orders, GET /api/orders/user/:id, GET /api/orders (staff/admin), PATCH /api/orders/:id/status, PATCH /api/orders/:id/assign-runner
- Runner: GET /api/runner/orders, PATCH /api/runner/orders/:id/delivered
- Admin: GET /api/admin/users, PATCH /api/admin/users/:id/role, GET /api/admin/reports

Socket namespace: `/orders`
- Emits to clients: `order:created`, `order:updated`, `stock:updated`, `runner:assigned`
- Staff broadcast helper: `order:update-status` (non-authoritative; REST updates are source of truth)

## Notes
- For protected routes, include `Authorization: Bearer <token>` header.
- On login/register, frontend stores token and userId in localStorage.
- Tailwind utilities come from `app/globals.css`.

## Microsoft Login (Azure AD / Entra ID)

Students must sign in with Microsoft. Staff/Runners/Admin can still use password login (or Microsoft if accounts exist).

Backend env (see `backend/.env.example`):
- CLIENT_ID
- CLIENT_SECRET
- TENANT_ID
- REDIRECT_URI (e.g. http://localhost:5000/auth/microsoft/callback)
- ALLOWED_EMAIL_DOMAINS (comma-separated list e.g. `iiit.ac.in,college.edu`)

Routes:
- GET /auth/microsoft → redirect to Microsoft login
- GET /auth/microsoft/callback → handles token exchange, fetches Graph profile, validates email domain, upserts user, issues JWT, then redirects to frontend with `?token=...`

Frontend:
- Login page has "Sign in with Microsoft" button
- After redirect, token in URL is stored; user is fetched via `/api/auth/me`.

RBAC:
- Students are auto-assigned and must use Microsoft; student routes enforce Microsoft-authenticated JWT.
