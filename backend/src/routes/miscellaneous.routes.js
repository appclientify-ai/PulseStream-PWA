import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import {
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord
} from '../controllers/miscellaneous.controller.js';

const router = express.Router();

router.use(authenticate);

// GST Registrations
router.get('/gst_registrations', getRecords('gst_registrations', 'gst_reg'));
router.post('/gst_registrations', createRecord('gst_registrations'));
router.put('/gst_registrations/:id', updateRecord('gst_registrations'));
router.delete('/gst_registrations/:id', deleteRecord('gst_registrations'));

// Food Licenses
router.get('/food_licenses', getRecords('food_licenses', 'food_lic'));
router.post('/food_licenses', createRecord('food_licenses'));
router.put('/food_licenses/:id', updateRecord('food_licenses'));
router.delete('/food_licenses/:id', deleteRecord('food_licenses'));

// MSME Registrations
router.get('/msme_registrations', getRecords('msme_registrations', 'msme'));
router.post('/msme_registrations', createRecord('msme_registrations'));
router.put('/msme_registrations/:id', updateRecord('msme_registrations'));
router.delete('/msme_registrations/:id', deleteRecord('msme_registrations'));

// Miscellaneous Work
router.get('/misc_work', getRecords('misc_work', 'misc_work'));
router.post('/misc_work', createRecord('misc_work'));
router.put('/misc_work/:id', updateRecord('misc_work'));
router.delete('/misc_work/:id', deleteRecord('misc_work'));

export default router;
