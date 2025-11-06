import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowed = ['student', 'staff', 'runner', 'admin'];
    if (!allowed.includes(role)) {
      res.status(400);
      throw new Error('Invalid role');
    }
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-passwordHash');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function reports(req, res, next) {
  try {
    const totalSalesAgg = await Order.aggregate([
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
    ]);
    const itemWiseAgg = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
      { $sort: { revenue: -1 } },
    ]);
    const busyAgg = await Order.aggregate([
      { $project: { hour: { $hour: '$createdAt' } } },
      { $group: { _id: '$hour', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalSales: totalSalesAgg[0] || { totalSales: 0, orders: 0 },
      itemWise: itemWiseAgg,
      busiestByHour: busyAgg,
    });
  } catch (err) {
    next(err);
  }
}
