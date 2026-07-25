import express from 'express';
import { 
  createItem, 
  getItems, 
  updateItem, 
  deleteItem, 
  patchAppData, 
  getDashboardSummaryData, 
  getMonthlyFilingData, 
  getQuarterlyFilingData, 
  getCompositionFilingData, 
  getGSTR4FilingData, 
  getGSTR9FilingData, 
  getITRReturnFilingData, 
  getTaxAuditFilingData, 
  getLitigationFilingData,
  getMessengerClientsAll,
  getMessengerClientsGst,
  getMessengerClientsItr,
  getMessengerClientsAudit,
  getMessengerClientsGstr4,
  getMessengerClientsGstr9,
  getRemindersAll,
  getRemindersLitigation,
  getRemindersWork
} from '../controllers/items.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

// All item routes require a valid JWT
router.use(authenticate);

router.get('/dashboard/summary', getDashboardSummaryData);
router.get('/filing/monthly', getMonthlyFilingData);
router.get('/filing/quarterly', getQuarterlyFilingData);
router.get('/filing/composition', getCompositionFilingData);
router.get('/filing/gstr4', getGSTR4FilingData);
router.get('/filing/gstr9', getGSTR9FilingData);
router.get('/filing/itr', getITRReturnFilingData);
router.get('/filing/audit', getTaxAuditFilingData);
router.get('/filing/litigation', getLitigationFilingData);

router.get('/messenger/all', getMessengerClientsAll);
router.get('/messenger/gst', getMessengerClientsGst);
router.get('/messenger/itr', getMessengerClientsItr);
router.get('/messenger/audit', getMessengerClientsAudit);
router.get('/messenger/gstr4', getMessengerClientsGstr4);
router.get('/messenger/gstr9', getMessengerClientsGstr9);

router.get('/reminders/all', getRemindersAll);
router.get('/reminders/litigation', getRemindersLitigation);
router.get('/reminders/work', getRemindersWork);
router.patch('/app_data/:key/patch', patchAppData);
router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
