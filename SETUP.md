# TuckHub Setup Guide

## ✅ What's Working Now

1. **Local Authentication** - Staff, Runners, and Admins can register and login with email/password
2. **Menu Browsing** - View all menu items with filtering and search
3. **Cart System** - Add items to cart, manage quantities
4. **Order Management** - Create and track orders
5. **Real-time Updates** - Socket.io for live order updates
6. **Staff Dashboard** - Drag-and-drop Kanban board for orders
7. **Runner Dashboard** - View and manage delivery tasks
8. **Admin Dashboard** - User management, reports, analytics
9. **Dark Mode** - Full theme switching support
10. **Responsive Design** - Works on all screen sizes

## 🔧 Features That Need Configuration

### 1. Microsoft OAuth (Student Login)

**Current Status:** Not configured - students cannot login yet

**To Enable:**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "App registrations" → "New registration"
3. Set redirect URI to: `http://localhost:5000/auth/microsoft/callback`
4. Copy the following values to `backend/.env`:
   ```
   CLIENT_ID=<your-application-client-id>
   CLIENT_SECRET=<your-client-secret>
   TENANT_ID=<your-tenant-id>
   ```
5. Update `ALLOWED_EMAIL_DOMAINS` with your institution's email domains (e.g., `iiit.ac.in`)

### 2. Stripe Payments

**Current Status:** Placeholder keys - payments won't process

**To Enable:**

1. Create account at [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your test API keys from the dashboard
3. Update `backend/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_<your-secret-key>
   STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>
   ```
4. Update `frontend/.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_<your-publishable-key>
   ```
5. For webhooks:
   - Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (Mac) or download from Stripe
   - Run: `stripe login`
   - Forward webhooks: `stripe listen --forward-to localhost:5000/api/webhooks/stripe`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## 🚀 Quick Start (Without OAuth/Stripe)

You can test the app immediately with local authentication:

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   ```

2. **Create test accounts:**
   - Go to http://localhost:3000/auth/register
   - Register as 'staff', 'runner', or 'admin' (NOT student)
   - Login and explore!

3. **Test the flow:**
   - **Staff:** Login → Go to `/staff/orders` to manage orders (Kanban board)
   - **Runner:** Login → Go to `/runner/tasks` to see delivery tasks
   - **Admin:** Login → Go to `/admin/reports` to view analytics

## 📝 Notes

- Students MUST use Microsoft OAuth - they cannot register with email/password
- Without Stripe configured, the checkout will fail at payment
- MongoDB must be running locally on port 27017
- All passwords are hashed with bcrypt
- JWT tokens expire after 7 days

## 🎨 Design Features Implemented

✅ Glassy UI with backdrop blur effects
✅ Material Symbols icons throughout
✅ Dark mode with smooth transitions
✅ Responsive 3-column menu layout
✅ Drag-and-drop Kanban board
✅ Interactive charts (recharts)
✅ Real-time socket updates
✅ Toast notifications
✅ Status badges with color coding
✅ Animated loaders and transitions

## 🐛 Troubleshooting

**Backend won't start:**
- Check MongoDB is running: `mongod --version`
- Verify `.env` file exists in `backend/` folder

**Frontend compilation errors:**
- Clear `.next` folder: `rm -rf .next`
- Reinstall: `npm install`

**Microsoft login not working:**
- Normal if Azure credentials not configured
- Use local login for staff/runner/admin instead

**Payments failing:**
- Expected without real Stripe keys
- Use test mode keys from Stripe dashboard

## 🔐 Security Notes

- Never commit `.env` files to git
- Use test keys for development
- Enable CORS only for trusted origins in production
- Rotate JWT_SECRET in production
- Use HTTPS in production for OAuth callbacks
