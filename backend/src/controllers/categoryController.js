import Category from '../models/Category.js';

export async function listCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ categories });
  } catch (err) { next(err); }
}

export async function createCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) { res.status(400); throw new Error('Name required'); }
    const existing = await Category.findOne({ name });
    if (existing) { res.status(400); throw new Error('Category exists'); }
    const category = await Category.create({ name });
    res.status(201).json({ category });
  } catch (err) { next(err); }
}

export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const category = await Category.findByIdAndUpdate(id, { name }, { new: true });
    if (!category) { res.status(404); throw new Error('Category not found'); }
    res.json({ category });
  } catch (err) { next(err); }
}

export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) { res.status(404); throw new Error('Category not found'); }
    res.json({ success: true });
  } catch (err) { next(err); }
}
