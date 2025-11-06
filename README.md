# TuckHub
Smart Campus Tuckshop Ordering & Management System with Real-Time Tracking

## Overview

TuckHub is a full-stack MERN application that modernizes campus tuckshop ordering with real-time updates, role-based dashboards, and seamless Microsoft authentication. Built following best practices from proven open-source food ordering systems.

## Stack
- **Frontend**: Next.js 14 (App Router), TailwindCSS, Socket.io-client, SWR
- **Backend**: Express.js, MongoDB (Mongoose), Socket.io, JWT Auth
- **Authentication**: JWT (Bearer) + Microsoft OAuth (Azure AD/Entra ID)
- **Real-Time**: Socket.io for live order tracking and stock updates

## Key Features

### For Students (Customers)
- 🔍 **Smart Menu Browsing**: Search and filter by categories with real-time stock updates
- 🛒 **Enhanced Cart**: Quantity controls, order summary, persistent storage
- 📦 **Real-Time Order Tracking**: Visual progress stepper showing order status (Placed → Making → Ready → Delivering → Completed)
- 📱 **Responsive Design**: Mobile-first interface inspired by modern food delivery apps
- 🔐 **Microsoft SSO**: Secure authentication with organizational accounts

### For Staff (Tuckshop Operators)
- 📊 **Kanban Order Board**: Color-coded columns for order stages with drag-and-drop workflow
- ⚡ **Real-Time Updates**: Instant notifications when new orders arrive
- 🔄 **Quick Status Changes**: One-click order progression through workflow stages
- 📦 **Inventory Management**: Toggle availability and update stock levels

### For Runners (Delivery)
- 🚴 **Active Deliveries Dashboard**: Card-based view of assigned orders
- ✅ **One-Click Delivery Confirmation**: Mark orders as delivered with real-time updates
- 📈 **Performance Tracking**: View completed deliveries and statistics

### For Admins
- 📊 **Rich Analytics**: Revenue metrics, order statistics, and performance indicators
- 📈 **Visual Reports**: Top-selling items, peak hours with interactive charts
- 👥 **User Management**: Role assignment and user administration
- 🏷️ **Category Management**: Organize menu items by categories

## Design Patterns & Inspiration

This project incorporates proven patterns from leading open-source food ordering systems:

### Real-Time Order Tracking (Socket.IO)
- **Pattern from**: [Foodeli](https://github.com/sayyidmarvanvt/Foodeli), [PizzaOrderApp](https://github.com/PareshMetaliya/PizzaOrderApp), [ChewChew](https://github.com/dhruvkaravadiya/ChewChew)
- **Implementation**: Socket.io broadcasts order status changes instantly to all connected clients (students, staff, runners)
- Events: `order:created`, `order:updated`, `stock:updated`, `runner:assigned`

### Modular Backend Structure
- **Pattern from**: [BrisaDiaz/Mern-stack-delivery-app](https://github.com/BrisaDiaz/Mern-stack-delivery-app), [Mshandev/Food-Delivery](https://github.com/Mshandev/Food-Delivery)
- **Implementation**: Clean separation with resource-based routes and controllers (auth, menu, orders, runner, admin)

### Enhanced UI/UX
- **Cart & Checkout Flow**: Inspired by [DulanjaliSenarathna/mern-food-delivery-app](https://github.com/DulanjaliSenarathna/mern-food-delivery-app)
- **Responsive Styling**: Mobile-first design using TailwindCSS patterns from [eminkmru/Full-Stack-food-ordering-Project-with-NextJS](https://github.com/eminkmru/Full-Stack-food-ordering-Project-with-NextJS)
- **Kanban Order Tracker**: Real-time visual progress inspired by BrisaDiaz's order tracking UI
- **Menu Filtering**: Dynamic category/search system from [ev0clu/food-ordering-app](https://github.com/ev0clu/food-ordering-app)

### Role-Based Dashboards
- **Pattern from**: ChewChew (customer vs restaurant owner roles), Dulanjali & Mshandev (admin panels)
- **Implementation**: Dedicated dashboards for students, staff, runners, and admins with role-specific features and UI

### Authentication & Security
- **Pattern from**: Mshandev's JWT implementation, eminkmru's NextAuth patterns
- **Implementation**: JWT-based REST API auth + Microsoft OAuth for students via MSAL

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or connection string
- (Optional) Azure AD app registration for Microsoft login

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

Backend runs on http://localhost:5000

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit if needed (default: http://localhost:5000)
npm install
npm run dev
```

Frontend runs on http://localhost:3000

### 3. Microsoft OAuth Setup (Optional but Recommended for Students)

1. Register an app in [Azure Portal](https://portal.azure.com)
2. Add redirect URI: `http://localhost:5000/auth/microsoft/callback`
3. Generate a client secret
4. Update `backend/.env`:
   ```
   CLIENT_ID=your-client-id
   CLIENT_SECRET=your-client-secret
   TENANT_ID=common
   REDIRECT_URI=http://localhost:5000/auth/microsoft/callback
   ALLOWED_EMAIL_DOMAINS=yourschool.edu,example.edu
   ```

## API Overview

### Authentication
- `POST /api/auth/register` - Register new user (staff/runner/admin)
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user
- `GET /auth/microsoft` - Initiate Microsoft OAuth flow
- `GET /auth/microsoft/callback` - Handle OAuth callback

### Menu Management
- `GET /api/menu` - List all menu items
- `POST /api/menu` - Create item (admin/staff)
- `PATCH /api/menu/:id` - Update item (admin/staff)
- `DELETE /api/menu/:id` - Delete item (admin/staff)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)
- `PATCH /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Orders
- `POST /api/orders` - Place new order (student)
- `GET /api/orders/user/:userId` - Get user's orders
- `GET /api/orders` - Get all orders (staff/admin)
- `PATCH /api/orders/:id/status` - Update order status (staff/admin)
- `PATCH /api/orders/:id/assign-runner` - Assign runner (staff/admin)

### Runner Operations
- `GET /api/runner/orders` - Get assigned orders
- `PATCH /api/runner/orders/:id/delivered` - Mark as delivered

### Admin
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/role` - Update user role
- `GET /api/admin/reports` - Get analytics and reports

### Socket.io Events (Namespace: `/orders`)
**Server → Client:**
- `order:created` - New order placed
- `order:updated` - Order status changed
- `stock:updated` - Item availability/stock changed
- `runner:assigned` - Runner assigned to order

## Architecture Highlights

### Real-Time Communication
Socket.io namespace `/orders` connects all clients. When staff update an order status, the event is broadcast to:
- Students tracking their orders
- Other staff members viewing the Kanban board
- Assigned runners monitoring their deliveries

### Role-Based Access Control (RBAC)
- **Middleware**: `authenticate()` verifies JWT, `authorize(['role'])` checks permissions
- **Student Enforcement**: `requireMicrosoftForStudent()` ensures students use Microsoft login
- **Client-Side**: `<RoleGate>` component restricts UI access

### State Management
- **Cart**: React Context with localStorage persistence
- **Auth**: React Context with token-based session
- **Orders**: SWR for data fetching with Socket.io for real-time updates

## Development Notes

### Frontend Structure
```
app/
├── page.tsx              # Landing page with hero
├── menu/                 # Menu browsing with search/filter
├── cart/                 # Cart with quantity controls
├── checkout/             # Order placement
├── orders/               # Order history
│   └── [id]/            # Order tracking with progress stepper
├── staff/
│   ├── orders/          # Kanban board
│   └── menu/            # Inventory management
├── runner/
│   └── tasks/           # Delivery dashboard
├── admin/
│   ├── reports/         # Analytics
│   ├── users/           # User management
│   └── menu/            # Category management
└── auth/
    ├── login/           # Microsoft SSO + local login
    └── register/        # User registration
```

### Backend Structure
```
src/
├── server.js            # Express app + Socket.io setup
├── controllers/         # Business logic by resource
├── middlewares/         # Auth, error handling
├── models/              # Mongoose schemas
├── routes/              # Express routes
└── sockets/             # Socket.io event handlers
```

## Attribution

TuckHub's architecture and UX patterns draw inspiration from these excellent open-source projects:

- [Foodeli](https://github.com/sayyidmarvanvt/Foodeli) - Real-time updates, mobile-first design
- [PizzaOrderApp](https://github.com/PareshMetaliya/PizzaOrderApp) - Order status updates, Redux patterns
- [ChewChew](https://github.com/dhruvkaravadiya/ChewChew) - Socket.io + role-based dashboards
- [BrisaDiaz/Mern-stack-delivery-app](https://github.com/BrisaDiaz/Mern-stack-delivery-app) - Kanban tracker, modular structure
- [Mshandev/Food-Delivery](https://github.com/Mshandev/Food-Delivery) - JWT authentication, admin panels
- [DulanjaliSenarathna/mern-food-delivery-app](https://github.com/DulanjaliSenarathna/mern-food-delivery-app) - Cart/checkout flow
- [eminkmru/Full-Stack-food-ordering-Project-with-NextJS](https://github.com/eminkmru/Full-Stack-food-ordering-Project-with-NextJS) - Next.js patterns, Tailwind styling
- [ev0clu/food-ordering-app](https://github.com/ev0clu/food-ordering-app) - Menu filtering, modern UI

## License

MIT

## Contributing

Contributions welcome! Please follow the existing code style and include tests for new features.
