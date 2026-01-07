
import express from 'express';
import { getLitigation, saveLitigation, deleteLitigation } from '../controllers/litigation.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getLitigation);
router.post('/', authenticate, saveLitigation);
router.delete('/:id', authenticate, deleteLitigation);

export default router;
