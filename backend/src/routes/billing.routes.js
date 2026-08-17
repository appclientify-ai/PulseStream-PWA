import express from 'express';
import {
  getInvoices,
  saveInvoice,
  deleteInvoice,
  getPayments,
  savePayment,
  deletePayment,
  getClientLedger,
  getInvoiceSettings,
  saveInvoiceSettings
} from '../controllers/billing.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Invoices
router.get('/invoices', getInvoices);
router.post('/invoices', saveInvoice);
router.put('/invoices/:id', saveInvoice);
router.delete('/invoices/:id', deleteInvoice);

// Payments
router.get('/payments', getPayments);
router.post('/payments', savePayment);
router.put('/payments/:id', savePayment);
router.delete('/payments/:id', deletePayment);

// Ledger
router.get('/ledger/:clientId', getClientLedger);
router.get('/ledger', getClientLedger);

// Settings
router.get('/settings', getInvoiceSettings);
router.post('/settings', saveInvoiceSettings);

export default router;
