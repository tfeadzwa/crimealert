import { Router } from 'express';
import { loginPolice, verifyTokenEndpoint, createPoliceUser } from '../controllers/auth.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public endpoints
router.post('/login', loginPolice);

// Protected endpoints
router.post('/verify', authMiddleware, verifyTokenEndpoint);
router.post('/create-user', authMiddleware, requireRole(['admin']), createPoliceUser);

export default router;

