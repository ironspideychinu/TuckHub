import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoryController.js';

const router = Router();

router.get('/', listCategories);
router.post('/', authenticate, authorize('admin'), createCategory);
router.patch('/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

export default router;
