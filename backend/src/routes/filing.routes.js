import express from 'express';
import {
  getMonthlyFiling,
  updateMonthlyFilingStatus,
  getMonthlyDueDates,
  updateMonthlyDueDates,
  getQuarterlyFiling,
  updateQuarterlyFilingStatus,
  getCompositionFiling,
  updateCompositionFilingStatus,
  getGSTR4Filing,
  updateGSTR4FilingStatus,
  getGSTR9Filing,
  updateGSTR9FilingStatus,
  updateGSTR9Watchlist,
  getITRFiling,
  updateITRFilingStatus,
  getTaxAuditFiling,
  updateTaxAuditFilingStatus,
  updateTaxAuditWatchlist
} from '../controllers/filing.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Monthly Filing APIs
router.get('/monthly', getMonthlyFiling);
router.post('/monthly/status', updateMonthlyFilingStatus);
router.get('/monthly/duedates', getMonthlyDueDates);
router.post('/monthly/duedates', updateMonthlyDueDates);

// Quarterly Filing APIs
router.get('/quarterly', getQuarterlyFiling);
router.post('/quarterly/status', updateQuarterlyFilingStatus);

// Composition Filing APIs
router.get('/composition', getCompositionFiling);
router.post('/composition/status', updateCompositionFilingStatus);

// Annual Returns - GSTR-4
router.get('/gstr4', getGSTR4Filing);
router.post('/gstr4/status', updateGSTR4FilingStatus);

// Annual Returns - GSTR-9 / 9C
router.get('/gstr9', getGSTR9Filing);
router.post('/gstr9/status', updateGSTR9FilingStatus);
router.post('/gstr9/watchlist', updateGSTR9Watchlist);

// Income Tax Returns
router.get('/itr', getITRFiling);
router.post('/itr/status', updateITRFilingStatus);

// Tax Audit
router.get('/audit', getTaxAuditFiling);
router.post('/audit/status', updateTaxAuditFilingStatus);
router.post('/audit/watchlist', updateTaxAuditWatchlist);

export default router;
