import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


function emitOrder(io, event, order) {
  io.of('/orders').emit(event, { order });
}

export async function createPaymentIntent(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Items required');
    }

    const itemIds = items.map((i) => i.itemId);
    const dbItems = await MenuItem.find({ _id: { $in: itemIds } });

    let subtotal = 0;
    const sanitizedItems = items.map((i) => {
      const dbi = dbItems.find((d) => String(d._id) === String(i.itemId));
      if (!dbi || !dbi.available) throw new Error(`${i.name || 'Item'} not available`);
      if (typeof dbi.stock === 'number' && dbi.stock < i.qty) throw new Error(`Not enough stock for ${dbi.name}`);
      subtotal += dbi.price * i.qty;
      return { itemId: dbi._id, name: dbi.name, price: dbi.price, qty: i.qty };
    });
    
    const serviceFee = 5;
    const totalAmount = subtotal + serviceFee;

    const order = await Order.create({
      userId: req.user.id,
      items: sanitizedItems,
      totalAmount,
      status: 'pending_payment',
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // amount in paise
      currency: 'INR',
      receipt: `order_${order._id}`,
      notes: {
        orderId: String(order._id),
        userId: String(req.user.id),
      }
    });

    order.paymentIntentId = razorpayOrder.id;
    await order.save();

    res.status(201).json({ 
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      orderId: order._id 
    });

  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400);
      throw new Error('Invalid payment signature');
    }

    // Update order status
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.status = 'placed';
    order.status_history.push({ status: 'placed', timestamp: new Date() });
    await order.save();

    // Decrement stock
    const itemIds = order.items.map((i) => i.itemId);
    const dbItems = await MenuItem.find({ _id: { $in: itemIds }});
    await Promise.all(
      order.items.map(async (item) => {
        const dbItem = dbItems.find(dbi => String(dbi._id) === String(item.itemId));
        if (dbItem && typeof dbItem.stock === 'number') {
          const newStock = Math.max(0, dbItem.stock - item.qty);
          await MenuItem.findByIdAndUpdate(dbItem._id, { stock: newStock, available: newStock > 0 });
        }
      })
    );

    emitOrder(req.app.locals.io, 'order:created', order);

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

export async function handleRazorpayWebhook(req, res, next) {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('Razorpay webhook signature verification failed');
      return res.sendStatus(400);
    }

    const event = req.body;

    // Handle payment success
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.notes.orderId;

      const order = await Order.findById(orderId);
      if (!order) {
        console.error(`Webhook Error: Order with ID ${orderId} not found.`);
        return res.sendStatus(404);
      }

      if (order.status === 'pending_payment') {
        order.status = 'placed';
        order.status_history.push({ status: 'placed', timestamp: new Date() });
        await order.save();

        // Decrement stock
        const itemIds = order.items.map((i) => i.itemId);
        const dbItems = await MenuItem.find({ _id: { $in: itemIds }});
        await Promise.all(
          order.items.map(async (item) => {
            const dbItem = dbItems.find(dbi => String(dbi._id) === String(item.itemId));
            if (dbItem && typeof dbItem.stock === 'number') {
              const newStock = Math.max(0, dbItem.stock - item.qty);
              await MenuItem.findByIdAndUpdate(dbItem._id, { stock: newStock, available: newStock > 0 });
            }
          })
        );
        
        emitOrder(req.app.locals.io, 'order:created', order);
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    res.sendStatus(500);
  }
}


export async function createOrder(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('Items required');
    }

    // Fetch items and compute totals; reduce stock
    const itemIds = items.map((i) => i.itemId);
    const dbItems = await MenuItem.find({ _id: { $in: itemIds }, available: true });

    let total = 0;
    const sanitizedItems = items.map((i) => {
      const dbi = dbItems.find((d) => String(d._id) === String(i.itemId));
      if (!dbi) throw new Error('Item not available');
      total += dbi.price * i.qty;
      return { itemId: dbi._id, name: dbi.name, price: dbi.price, qty: i.qty };
    });

    // Decrement stock if tracked
    await Promise.all(
      sanitizedItems.map(async (si) => {
        const item = dbItems.find((d) => String(d._id) === String(si.itemId));
        if (typeof item.stock === 'number' && item.stock > 0) {
          const newStock = Math.max(0, item.stock - si.qty);
          await MenuItem.findByIdAndUpdate(item._id, { stock: newStock, available: newStock > 0 });
        }
      })
    );

    const order = await Order.create({ userId: req.user.id, items: sanitizedItems, totalAmount: total });

    emitOrder(req.app.locals.io, 'order:created', order);
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

export async function getOrdersForUser(req, res, next) {
  try {
    const { id } = req.params;
    if (String(id) !== String(req.user.id) && !['admin', 'staff'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden');
    }
    const orders = await Order.find({ userId: id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function getOrders(req, res, next) {
  try {
    if (!['admin', 'staff'].includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden');
    }
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['placed', 'making', 'ready', 'delivering', 'completed'];
    if (!valid.includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }
    const order = await Order.findById(id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    order.status = status;
    order.status_history.push({ status, timestamp: new Date() });
    await order.save();

    emitOrder(req.app.locals.io, 'order:updated', order);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

export async function assignRunner(req, res, next) {
  try {
    const { id } = req.params;
    const { runnerId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(runnerId)) {
      res.status(400);
      throw new Error('Invalid runnerId');
    }
    const order = await Order.findByIdAndUpdate(
      id,
      { assignedRunnerId: runnerId },
      { new: true }
    );
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    req.app.locals.io.of('/orders').emit('runner:assigned', { orderId: order._id, runnerId });
    res.json({ order });
  } catch (err) {
    next(err);
  }
}
