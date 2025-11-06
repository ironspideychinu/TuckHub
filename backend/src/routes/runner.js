import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { getRunnerOrders, markDelivered } from '../controllers/runnerController.js';

const router = Router();

router.get('/orders', authenticate, authorize('runner'), getRunnerOrders);
router.patch('/orders/:id/delivered', authenticate, authorize('runner'), markDelivered);

export default router;
