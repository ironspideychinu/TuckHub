import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { createMenuItem, deleteMenuItem, getMenu, updateMenuItem } from '../controllers/menuController.js';

const router = Router();

router.get('/', getMenu);
router.post('/', authenticate, authorize('admin'), createMenuItem);
router.patch('/:id', authenticate, authorize('admin'), updateMenuItem);
router.delete('/:id', authenticate, authorize('admin'), deleteMenuItem);

export default router;
