import express from 'express';
import { getDashboardData } from '../controllers/dashboard.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getDashboardData);
router.get('/stats', getDashboardData);
router.get('/', getDashboardData);

export default router;
