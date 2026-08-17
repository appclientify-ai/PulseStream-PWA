import express from 'express';
import {
  getGSTPortfolio,
  getITPortfolio,
  getClientById,
  saveClient,
  deleteClient
} from '../controllers/portfolio.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/gst', getGSTPortfolio);
router.get('/it', getITPortfolio);
router.get('/client/:id', getClientById);
router.post('/client', saveClient);
router.put('/client/:id', saveClient);
router.delete('/client/:id', deleteClient);

export default router;
