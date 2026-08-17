import { getCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

const getUserMatches = (userId) => {
  const userMatches = [userId];
  if (userId) {
    userMatches.push(userId.toString());
    if (ObjectId.isValid(userId)) {
      try { userMatches.push(new ObjectId(userId)); } catch (e) {}
    }
  }
  return userMatches;
};

// --- Generic Helper for App Data ---
const getAppDataRecord = async (key, userId) => {
  const items = getCollection('items');
  const userMatches = getUserMatches(userId);
  const name = key.startsWith('app_data_') ? key : 'app_data_' + key;
  const doc = await items.findOne({ name, createdBy: { $in: userMatches } });
  return doc ? doc.data || {} : {};
};

const updateAppDataField = async (key, fieldPath, value, userId, io, eventName = 'filing_single_updated', extraEventData = {}) => {
  const items = getCollection('items');
  const name = key.startsWith('app_data_') ? key : 'app_data_' + key;
  
  await items.findOneAndUpdate(
    { name, createdBy: userId },
    { 
      $set: { [fieldPath]: value, updatedAt: new Date() },
      $setOnInsert: { name, createdBy: userId, createdAt: new Date() }
    },
    { returnDocument: 'after', upsert: true }
  );

  if (io) {
    io.emit(eventName, { storageKey: key, ...extraEventData, value, timestamp: new Date() });
    io.emit('db_item_change', { type: 'single_filing_update', storageKey: key, ...extraEventData, value });
  }
};

// ==========================================
// 1. MONTHLY FILING CONTROLLERS
// ==========================================
export const getMonthlyFiling = async (req, res) => {
  try {
    const { year, month } = req.query;
    const storageKey = 'monthly_filing_status';
    const data = await getAppDataRecord(storageKey, req.user._id);
    
    if (year && month) {
      const periodKey = `${year}_${month}`;
      return res.json({ periodKey, data: data[periodKey] || {} });
    }
    res.json({ storageKey, data });
  } catch (err) {
    console.error('getMonthlyFiling error:', err);
    res.status(500).json({ error: 'Failed to retrieve monthly filing data' });
  }
};

export const updateMonthlyFilingStatus = async (req, res) => {
  try {
    const { clientId, year, month, field, value } = req.body;
    const periodKey = `${year}_${month}`;
    const storageKey = 'monthly_filing_status';
    const fieldPath = `data.${periodKey}.${clientId}.${field}`;
    
    await updateAppDataField(storageKey, fieldPath, value, req.user._id, req.app.get('io'), 'filing_single_updated', {
      clientId,
      periodKey,
      field,
      module: 'monthly'
    });

    res.json({ success: true, updated: { storageKey, clientId, periodKey, field, value } });
  } catch (err) {
    console.error('updateMonthlyFilingStatus error:', err);
    res.status(500).json({ error: 'Failed to update monthly status' });
  }
};

export const getMonthlyDueDates = async (req, res) => {
  try {
    const storageKey = 'monthly_filing_dates';
    const data = await getAppDataRecord(storageKey, req.user._id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get monthly due dates' });
  }
};

export const updateMonthlyDueDates = async (req, res) => {
  try {
    const { year, month, dates } = req.body;
    const periodKey = `${year}_${month}`;
    const storageKey = 'monthly_filing_dates';
    const fieldPath = `data.${periodKey}`;
    
    await updateAppDataField(storageKey, fieldPath, dates, req.user._id, req.app.get('io'), 'filing_dates_updated', {
      periodKey,
      module: 'monthly'
    });

    res.json({ success: true, periodKey, dates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update monthly due dates' });
  }
};

// ==========================================
// 2. QUARTERLY FILING CONTROLLERS
// ==========================================
export const getQuarterlyFiling = async (req, res) => {
  try {
    const { year, quarter } = req.query;
    const storageKey = 'quarterly_filing_status';
    const data = await getAppDataRecord(storageKey, req.user._id);
    
    if (year && quarter) {
      const periodKey = `${year}_${quarter}`;
      return res.json({ periodKey, data: data[periodKey] || {} });
    }
    res.json({ storageKey, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve quarterly filing data' });
  }
};

export const updateQuarterlyFilingStatus = async (req, res) => {
  try {
    const { clientId, year, quarter, field, value } = req.body;
    const periodKey = `${year}_${quarter}`;
    const storageKey = 'quarterly_filing_status';
    const fieldPath = `data.${periodKey}.${clientId}.${field}`;
    
    await updateAppDataField(storageKey, fieldPath, value, req.user._id, req.app.get('io'), 'filing_single_updated', {
      clientId,
      periodKey,
      field,
      module: 'quarterly'
    });

    res.json({ success: true, updated: { storageKey, clientId, periodKey, field, value } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quarterly status' });
  }
};

// ==========================================
// 3. COMPOSITION FILING CONTROLLERS
// ==========================================
export const getCompositionFiling = async (req, res) => {
  try {
    const { year, quarter } = req.query;
    const storageKey = 'composition_filing_status';
    const data = await getAppDataRecord(storageKey, req.user._id);
    
    if (year && quarter) {
      const periodKey = `${year}_${quarter}`;
      return res.json({ periodKey, data: data[periodKey] || {} });
    }
    res.json({ storageKey, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve composition filing data' });
  }
};

export const updateCompositionFilingStatus = async (req, res) => {
  try {
    const { clientId, year, quarter, value } = req.body;
    const periodKey = `${year}_${quarter}`;
    const storageKey = 'composition_filing_status';
    const fieldPath = `data.${periodKey}.${clientId}.cmp08`;
    
    await updateAppDataField(storageKey, fieldPath, value, req.user._id, req.app.get('io'), 'filing_single_updated', {
      clientId,
      periodKey,
      field: 'cmp08',
      module: 'composition'
    });

    res.json({ success: true, updated: { storageKey, clientId, periodKey, field: 'cmp08', value } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update composition status' });
  }
};

// ==========================================
// 4. GSTR-4 FILING CONTROLLERS
// ==========================================
export const getGSTR4Filing = async (req, res) => {
  try {
    const { year } = req.query;
    const storageKey = 'gstr4_filing_data';
    const data = await getAppDataRecord(storageKey, req.user._id);
    if (year) {
      return res.json({ year, data: data[year] || {} });
    }
    res.json({ storageKey, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve GSTR-4 filing data' });
  }
};

export const updateGSTR4FilingStatus = async (req, res) => {
  try {
    const { clientId, year, filed, filedDate, remarks } = req.body;
    const storageKey = 'gstr4_filing_data';
    const updateObj = {};
    if (filed !== undefined) updateObj[`data.${year}.${clientId}.filed`] = filed;
    if (filedDate !== undefined) updateObj[`data.${year}.${clientId}.filedDate`] = filedDate;
    if (remarks !== undefined) updateObj[`data.${year}.${clientId}.remarks`] = remarks;

    const items = getCollection('items');
    const name = 'app_data_' + storageKey;
    await items.findOneAndUpdate(
      { name, createdBy: req.user._id },
      { 
        $set: { ...updateObj, updatedAt: new Date() },
        $setOnInsert: { name, createdBy: req.user._id, createdAt: new Date() }
      },
      { upsert: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('filing_single_updated', { storageKey, clientId, periodKey: year, field: 'filed', value: filed });
      io.emit('db_item_change', { type: 'single_filing_update', storageKey, clientId, periodKey: year, field: 'filed', value: filed });
    }

    res.json({ success: true, updated: { clientId, year, filed, filedDate, remarks } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update GSTR-4 status' });
  }
};

// ==========================================
// 5. GSTR-9 / 9C FILING CONTROLLERS
// ==========================================
export const getGSTR9Filing = async (req, res) => {
  try {
    const { year } = req.query;
    const [filingData, watchlist] = await Promise.all([
      getAppDataRecord('gstr9_filing_data', req.user._id),
      getAppDataRecord('gstr9_watchlist', req.user._id)
    ]);
    res.json({ filingData: year ? (filingData[year] || {}) : filingData, watchlist });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve GSTR-9 data' });
  }
};

export const updateGSTR9FilingStatus = async (req, res) => {
  try {
    const { clientId, year, field, value } = req.body;
    const storageKey = 'gstr9_filing_data';
    const fieldPath = `data.${year}.${clientId}.${field}`;
    
    await updateAppDataField(storageKey, fieldPath, value, req.user._id, req.app.get('io'), 'filing_single_updated', {
      clientId,
      periodKey: year,
      field,
      module: 'gstr9'
    });

    res.json({ success: true, updated: { clientId, year, field, value } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update GSTR-9 status' });
  }
};

export const updateGSTR9Watchlist = async (req, res) => {
  try {
    const { clientId, isApplicable } = req.body;
    const storageKey = 'gstr9_watchlist';
    const fieldPath = `data.${clientId}`;
    
    await updateAppDataField(storageKey, fieldPath, isApplicable, req.user._id, req.app.get('io'), 'filing_watchlist_updated', {
      clientId,
      isApplicable,
      module: 'gstr9'
    });

    res.json({ success: true, clientId, isApplicable });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update GSTR-9 watchlist' });
  }
};

// ==========================================
// 6. INCOME TAX RETURN (ITR) CONTROLLERS
// ==========================================
export const getITRFiling = async (req, res) => {
  try {
    const { ay } = req.query;
    const data = await getAppDataRecord('itr_filing_status_v1', req.user._id);
    res.json(ay ? { ay, data: data[ay] || {} } : data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve ITR filing data' });
  }
};

export const updateITRFilingStatus = async (req, res) => {
  try {
    const { clientId, ay, statusData } = req.body;
    const storageKey = 'itr_filing_status_v1';
    const fieldPath = `data.${ay}.${clientId}`;
    
    await updateAppDataField(storageKey, fieldPath, statusData, req.user._id, req.app.get('io'), 'filing_single_updated', {
      clientId,
      periodKey: ay,
      module: 'itr',
      value: statusData
    });

    res.json({ success: true, clientId, ay, statusData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ITR filing status' });
  }
};

// ==========================================
// 7. TAX AUDIT CONTROLLERS
// ==========================================
export const getTaxAuditFiling = async (req, res) => {
  try {
    const { year } = req.query;
    const [filingData, watchlist] = await Promise.all([
      getAppDataRecord('tax_audit_filing_status_v1', req.user._id),
      getAppDataRecord('tax_audit_watchlist_v1', req.user._id)
    ]);
    res.json({ filingData: year ? (filingData[year] || {}) : filingData, watchlist });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve Tax Audit data' });
  }
};

export const updateTaxAuditFilingStatus = async (req, res) => {
  try {
    const { clientId, year, statusData } = req.body;
    const storageKey = 'tax_audit_filing_status_v1';
    const fieldPath = `data.${year}.${clientId}`;
    
    await updateAppDataField(storageKey, fieldPath, statusData, req.user._id, req.app.get('io'), 'filing_single_updated', {
      clientId,
      periodKey: year,
      module: 'tax_audit',
      value: statusData
    });

    res.json({ success: true, clientId, year, statusData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update Tax Audit status' });
  }
};

export const updateTaxAuditWatchlist = async (req, res) => {
  try {
    const { clientId, isApplicable } = req.body;
    const storageKey = 'tax_audit_watchlist_v1';
    const fieldPath = `data.${clientId}`;
    
    await updateAppDataField(storageKey, fieldPath, isApplicable, req.user._id, req.app.get('io'), 'filing_watchlist_updated', {
      clientId,
      isApplicable,
      module: 'tax_audit'
    });

    res.json({ success: true, clientId, isApplicable });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update Tax Audit watchlist' });
  }
};
