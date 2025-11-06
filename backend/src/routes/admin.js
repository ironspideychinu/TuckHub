import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { listUsers, reports, updateUserRole } from '../controllers/adminController.js';

const router = Router();

router.use(authenticate, authorize('admin'));
router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/reports', reports);

export default router;
