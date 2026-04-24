import { Router } from 'express';
import reportRoutes from './report.routes';
import authRoutes from './auth.routes';
import smsRoutes from './sms.routes';

const router = Router();

// Mount routes
router.use('/reports', reportRoutes);
router.use('/auth', authRoutes);
router.use('/', smsRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Crime Alert System API',
    version: process.env.API_VERSION || 'v1',
    description: 'Crime reporting and management system for Zimbabwe',
    endpoints: {
      reports: '/reports',
      auth: '/auth',
      incoming_sms: '/incoming_sms',
      outgoing_sms: '/outgoing_sms',
      health: '/health'
    }
  });
});

export default router;
