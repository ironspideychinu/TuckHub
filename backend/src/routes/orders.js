import { Router } from 'express';
import { authenticate, authorize, requireMicrosoftForStudent } from '../middlewares/auth.js';
import { assignRunner, createOrder, getOrders, getOrdersForUser, updateOrderStatus } from '../controllers/orderController.js';

const router = Router();

router.post('/', authenticate, requireMicrosoftForStudent, authorize('student', 'admin'), createOrder);
router.get('/user/:id', authenticate, requireMicrosoftForStudent, getOrdersForUser);
router.get('/', authenticate, authorize('staff', 'admin'), getOrders);
router.patch('/:id/status', authenticate, authorize('staff', 'admin'), updateOrderStatus);
router.patch('/:id/assign-runner', authenticate, authorize('staff', 'admin'), assignRunner);

export default router;
