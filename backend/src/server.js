import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import runnerRoutes from './routes/runner.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { registerOrderSocket } from './sockets/orders.js';
import { microsoftAuth, microsoftCallback } from './controllers/authController.js';
import { handleRazorpayWebhook } from './controllers/orderController.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN?.split(',') || '*',
    credentials: true
  }
});

// Share io via app locals
app.locals.io = io;

io.of('/orders'); // init namespace early
registerOrderSocket(io);

// Middleware
app.post('/api/webhooks/razorpay', express.raw({type: 'application/json'}), handleRazorpayWebhook);
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// DB Connect
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Missing MONGODB_URI in environment.');
  process.exit(1);
}
mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
// Also expose top-level OAuth endpoints to match spec
app.get('/auth/microsoft', microsoftAuth);
app.get('/auth/microsoft/callback', microsoftCallback);
app.use('/api/menu', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/runner', runnerRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
