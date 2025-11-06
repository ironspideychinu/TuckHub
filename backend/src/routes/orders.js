import { Router } from 'express';
import { authenticate, authorize, requireMicrosoftForStudent } from '../middlewares/auth.js';
import { assignRunner, createOrder, getOrders, getOrdersForUser, updateOrderStatus, createPaymentIntent, verifyPayment } from '../controllers/orderController.js';

const router = Router();

router.post('/create-payment-intent', authenticate, requireMicrosoftForStudent, authorize('student', 'admin'), createPaymentIntent);
router.post('/verify-payment', authenticate, requireMicrosoftForStudent, authorize('student', 'admin'), verifyPayment);
router.post('/', authenticate, requireMicrosoftForStudent, authorize('student', 'admin'), createOrder);
router.get('/user/:id', authenticate, requireMicrosoftForStudent, getOrdersForUser);
router.get('/', authenticate, authorize('staff', 'admin'), getOrders);
router.patch('/:id/status', authenticate, authorize('staff', 'admin'), updateOrderStatus);
router.patch('/:id/assign-runner', authenticate, authorize('staff', 'admin'), assignRunner);

export default router;
