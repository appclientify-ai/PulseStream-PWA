import express from 'express';
import { createItem, getItems, updateItem, deleteItem } from '../controllers/items.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

// All item routes require a valid JWT
router.use(authenticate);

router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
