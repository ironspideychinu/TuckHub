import { Router } from 'express';
import { login, me, register, microsoftAuth, microsoftCallback } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);

// Microsoft OAuth
router.get('/microsoft', microsoftAuth);
router.get('/microsoft/callback', microsoftCallback);

export default router;
