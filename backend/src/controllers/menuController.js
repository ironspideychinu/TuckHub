import MenuItem from '../models/MenuItem.js';

export async function getMenu(req, res, next) {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function createMenuItem(req, res, next) {
  try {
    const { name, price, image, category, available, stock } = req.body;
    const item = await MenuItem.create({ name, price, image, category, available, stock });
    // emit stock updated
    req.app.locals.io.of('/orders').emit('stock:updated', { itemId: item._id, available: item.available, stock: item.stock });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function updateMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const update = req.body;
    const item = await MenuItem.findByIdAndUpdate(id, update, { new: true });
    if (!item) {
      res.status(404);
      throw new Error('Menu item not found');
    }
    req.app.locals.io.of('/orders').emit('stock:updated', { itemId: item._id, available: item.available, stock: item.stock });
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

export async function deleteMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByIdAndDelete(id);
    if (!item) {
      res.status(404);
      throw new Error('Menu item not found');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
