import Order from '../models/Order.js';

export async function getRunnerOrders(req, res, next) {
  try {
    const orders = await Order.find({ assignedRunnerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function markDelivered(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ _id: id, assignedRunnerId: req.user.id });
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    order.status = 'completed';
    order.status_history.push({ status: 'completed', timestamp: new Date() });
    await order.save();
    req.app.locals.io.of('/orders').emit('order:updated', { order });
    res.json({ order });
  } catch (err) {
    next(err);
  }
}
