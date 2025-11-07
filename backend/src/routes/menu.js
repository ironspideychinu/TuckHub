import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { createMenuItem, deleteMenuItem, getMenu, updateMenuItem } from '../controllers/menuController.js';

const router = Router();

router.get('/', getMenu);
// Allow both staff and admin to manage menu items
// Only staff (tuckshop) can mutate menu; admin observes via reports/users
router.post('/', authenticate, authorize('staff'), createMenuItem);
router.patch('/:id', authenticate, authorize('staff'), updateMenuItem);
router.delete('/:id', authenticate, authorize('staff'), deleteMenuItem);

export default router;
