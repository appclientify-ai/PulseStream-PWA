
import express from 'express';
import { login, signup, me, updateProfile, recoverIdentity, resetPasswordRecovery } from './auth.controller.js';
import { authenticate } from './auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/me', authenticate, me);
router.put('/update', authenticate, updateProfile);

// Recovery endpoints (unauthenticated)
router.post('/recover-identity', recoverIdentity);
router.post('/reset-password-recovery', resetPasswordRecovery);

export default router;
