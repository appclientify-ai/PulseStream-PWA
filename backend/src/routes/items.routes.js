
import express from 'express';
import { createItem, getItems } from '../controllers/items.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, createItem);
router.get('/', authenticate, getItems);

export default router;
