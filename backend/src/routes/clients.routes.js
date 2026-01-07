
import express from 'express';
import { getClients, saveClient, deleteClient } from '../controllers/clients.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getClients);
router.post('/', authenticate, saveClient);
router.delete('/:id', authenticate, deleteClient);

export default router;
