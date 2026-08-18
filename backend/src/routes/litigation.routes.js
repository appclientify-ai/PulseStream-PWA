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

// Tribunal Records
router.get('/tribunal_records', getLitigationRecords('tribunal_records', 'Tribunal'));
router.post('/tribunal_records', createLitigationRecord('tribunal_records'));
router.put('/tribunal_records/:id', updateLitigationRecord('tribunal_records'));
router.delete('/tribunal_records/:id', deleteLitigationRecord('tribunal_records'));

// High Court Records
router.get('/highcourt_records', getLitigationRecords('highcourt_records', 'HighCourt'));
router.post('/highcourt_records', createLitigationRecord('highcourt_records'));
router.put('/highcourt_records/:id', updateLitigationRecord('highcourt_records'));
router.delete('/highcourt_records/:id', deleteLitigationRecord('highcourt_records'));

export default router;
