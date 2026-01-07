
import express from 'express';
import { getInvoices, saveInvoice, deleteInvoice, generateNextInvoiceNo } from '../controllers/invoices.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getInvoices);
router.post('/', authenticate, saveInvoice);
router.get('/next-number', authenticate, generateNextInvoiceNo);
router.delete('/:id', authenticate, deleteInvoice);

export default router;
