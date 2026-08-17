import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import {
  getLitigationRecords,
  createLitigationRecord,
  updateLitigationRecord,
  deleteLitigationRecord
} from '../controllers/litigation.controller.js';

const router = express.Router();

router.use(authenticate);

// Notice Records
router.get('/litigation/notices', getLitigationRecords('litigation_notices', 'Notice'));
router.post('/litigation/notices', createLitigationRecord('litigation_notices'));
router.put('/litigation/notices/:id', updateLitigationRecord('litigation_notices'));
router.delete('/litigation/notices/:id', deleteLitigationRecord('litigation_notices'));

// Appeal Records
router.get('/litigation/appeals', getLitigationRecords('litigation_appeals', 'Appeal'));
router.post('/litigation/appeals', createLitigationRecord('litigation_appeals'));
router.put('/litigation/appeals/:id', updateLitigationRecord('litigation_appeals'));
router.delete('/litigation/appeals/:id', deleteLitigationRecord('litigation_appeals'));

// Tribunal Records
router.get('/tribunal_records', getLitigationRecords('tribunal_records', 'Tribunal'));
router.post('/tribunal_records', createLitigationRecord('tribunal_records'));
router.put('/tribunal_records/:id', updateLitigationRecord('tribunal_records'));
router.delete('/tribunal_records/:id', deleteLitigationRecord('tribunal_records'));

router.get('/litigation/tribunal', getLitigationRecords('tribunal_records', 'Tribunal'));
router.post('/litigation/tribunal', createLitigationRecord('tribunal_records'));
router.put('/litigation/tribunal/:id', updateLitigationRecord('tribunal_records'));
router.delete('/litigation/tribunal/:id', deleteLitigationRecord('tribunal_records'));

// High Court Records
router.get('/highcourt_records', getLitigationRecords('highcourt_records', 'HighCourt'));
router.post('/highcourt_records', createLitigationRecord('highcourt_records'));
router.put('/highcourt_records/:id', updateLitigationRecord('highcourt_records'));
router.delete('/highcourt_records/:id', deleteLitigationRecord('highcourt_records'));

router.get('/litigation/highcourt', getLitigationRecords('highcourt_records', 'HighCourt'));
router.post('/litigation/highcourt', createLitigationRecord('highcourt_records'));
router.put('/litigation/highcourt/:id', updateLitigationRecord('highcourt_records'));
router.delete('/litigation/highcourt/:id', deleteLitigationRecord('highcourt_records'));

export default router;
