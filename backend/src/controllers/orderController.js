import mongoose from 'mongoose';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';

function emitOrder(io, event, order) {
  io.of('/orders').emit(event, { order });
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
