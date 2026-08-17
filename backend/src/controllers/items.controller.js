import { getCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

const buildItemQuery = (id, userId) => {
  const idMatches = [id];
  if (id && ObjectId.isValid(id)) {
    try { idMatches.push(new ObjectId(id)); } catch (e) {}
  }
  
  const userMatches = [userId];
  if (userId) {
    userMatches.push(userId.toString());
    if (ObjectId.isValid(userId)) {
      try { userMatches.push(new ObjectId(userId)); } catch (e) {}
    }
  }

  return {
    _id: { $in: idMatches },
    createdBy: { $in: userMatches }
  };
};

export const createItem = async (req, res) => {
  const { name, data } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Item category name is required' });
  }

  try {
    const items = getCollection('items');
    const newItem = {
      name, // e.g., 'client', 'litigation', 'invoice'
      data: data || {},
      createdBy: req.user._id,
      creatorName: req.user.username,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await items.insertOne(newItem);
    
    // Unwrap the result if it's nested
    if (result && result.value) {
      result = result.value;
    }
    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'insert', data: { ...newItem, _id: result.insertedId }, id: result.insertedId, timestamp: new Date() });
    }
    res.status(201).json({ ...newItem, _id: result.insertedId });

  } catch (err) {
    console.error('Create Item Error:', err);
    res.status(500).json({ error: 'Failed to archive record in vault' });
  }
};

export const getItems = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const query = { createdBy: { $in: userMatches } };

    const nameParam = req.query.name || req.query.category;
    if (nameParam) {
      query.name = nameParam;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { 'data.name': searchRegex },
        { 'data.clientName': searchRegex },
        { 'data.clientTradeName': searchRegex },
        { 'data.invoiceNo': searchRegex },
        { 'data.firmName': searchRegex },
        { 'data.gstin': searchRegex },
        { 'data.tradeName': searchRegex }
      ];
    }

    const itemsColl = getCollection('items');

    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);

    if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      const total = await itemsColl.countDocuments(query);
      const skip = (page - 1) * limit;
      const items = await itemsColl
        .find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      res.set('X-Total-Count', total.toString());
      return res.json({
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    }

    const items = await itemsColl
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    res.set('X-Total-Count', items.length.toString());
    res.json(items);
  } catch (err) {
    console.error('Get Items Error:', err);
    res.status(500).json({ error: 'Failed to retrieve vault records' });
  }
};

export const updateItem = async (req, res) => {
  const { id } = req.params;
  const { name, data } = req.body;

  try {
    const items = getCollection('items');
    const query = buildItemQuery(id, req.user._id);
    const result = await items.findOneAndUpdate(
      query,
      { 
        $set: { 
          name, 
          data, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Record not found or unauthorized' });
    }

    // Unwrap the result if it's nested
    if (result && result.value) {
      result = result.value;
    }
    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'update', data: result, id: id, timestamp: new Date() });
    }
    res.json(result);

  } catch (err) {
    console.error('Update Item Error:', err);
    res.status(500).json({ error: 'Failed to update vault record' });
  }
};

export const deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    const items = getCollection('items');
    const query = buildItemQuery(id, req.user._id);
    const result = await items.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Record not found or unauthorized' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'delete', id: id, timestamp: new Date() });
    }
    res.json({ message: 'Record permanently removed from vault' });

  } catch (err) {
    console.error('Delete Item Error:', err);
    res.status(500).json({ error: 'Failed to delete vault record' });
  }
};

export const patchAppData = async (req, res) => {
  const { key } = req.params;
  const { updates } = req.body; // e.g. { "data.2023_April.client1.r1": true }
  
  try {
    const items = getCollection('items');
    
    // Check if the item exists
    const existing = await items.findOne({ name: 'app_data_' + key, createdBy: req.user._id });
    
    let result;
    if (existing) {
      result = await items.findOneAndUpdate(
        { _id: existing._id },
        { 
          $set: { ...updates, updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );
    } else {
      // Upsert
      result = await items.findOneAndUpdate(
        { name: 'app_data_' + key, createdBy: req.user._id },
        { 
          $set: { ...updates, updatedAt: new Date() },
          $setOnInsert: { name: 'app_data_' + key, createdBy: req.user._id, creatorName: req.user.username, createdAt: new Date() }
        },
        { returnDocument: 'after', upsert: true }
      );
    }

    
    // Unwrap the result if it's nested
    if (result && result.value) {
      result = result.value;
    }
    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'update', data: result, id: result._id, timestamp: new Date() });
    }
    
    res.json(result);
  } catch (err) {
    console.error('Patch AppData Error:', err);
    res.status(500).json({ error: 'Failed to patch app data' });
  }
};

export const updateSingleFilingStatus = async (req, res) => {
  const { storageKey, clientId, periodKey, field, value } = req.body;
  
  if (!storageKey || !clientId || !periodKey || !field) {
    return res.status(400).json({ error: 'Missing required parameters (storageKey, clientId, periodKey, field)' });
  }

  try {
    const items = getCollection('items');
    const name = storageKey.startsWith('app_data_') ? storageKey : 'app_data_' + storageKey;
    const updatePath = `data.${periodKey}.${clientId}.${field}`;
    
    await items.findOneAndUpdate(
      { name: name, createdBy: req.user._id },
      { 
        $set: { [updatePath]: value, updatedAt: new Date() },
        $setOnInsert: { name: name, createdBy: req.user._id, creatorName: req.user.username, createdAt: new Date() }
      },
      { returnDocument: 'after', upsert: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('filing_single_updated', { storageKey, clientId, periodKey, field, value, timestamp: new Date() });
      io.emit('db_item_change', { type: 'single_filing_update', storageKey, clientId, periodKey, field, value });
    }

    res.json({ success: true, updated: { storageKey, clientId, periodKey, field, value } });
  } catch (err) {
    console.error('Update Single Filing Error:', err);
    res.status(500).json({ error: 'Failed to update single filing status' });
  }
};

export const getDashboardSummaryData = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const tribunalColl = getCollection('tribunal_records');
    const highcourtColl = getCollection('highcourt_records');

    const appDataKeys = [
      'clientify_monthly_filing_v3',
      'clientify_quarterly_filing_v3',
      'clientify_composition_filing_v3',
      'clientify_gstr4_filing_v1',
      'clientify_gstr9_filing_data_v2',
      'clientify_itr_filing_data_v2',
      'clientify_audit_fin_data_v3',
      'clientify_gstr9_watchlist_v2'
    ];
    const appDataNames = appDataKeys.map(k => 'app_data_' + k);
    const categoryNames = ['client', 'litigation', 'invoice', 'work', 'gstReg', 'foodLic', 'msme', 'payment'];

    const query = {
      createdBy: { $in: userMatches },
      name: { $in: [...categoryNames, ...appDataNames] }
    };

    const [rawItems, rawTribunal, rawHighCourt] = await Promise.all([
      itemsColl.find(query).toArray(),
      tribunalColl ? tribunalColl.find({ createdBy: { $in: userMatches } }).toArray() : [],
      highcourtColl ? highcourtColl.find({ createdBy: { $in: userMatches } }).toArray() : []
    ]);

    const tribunalRecords = (rawTribunal || []).map(t => ({ ...t, id: t._id, category: t.category || 'Tribunal' }));
    const highcourtRecords = (rawHighCourt || []).map(h => ({ ...h, id: h._id, category: h.category || 'HighCourt' }));

    const summary = {
      clients: [],
      litigation: [],
      invoices: [],
      work: [],
      gstReg: [],
      foodLic: [],
      msme: [],
      payments: []
    };
    const filingDataCache = {};

    for (const item of rawItems) {
      const transformed = {
        ...item.data,
        id: item._id,
        createdAt: item.createdAt
      };

      if (item.name === 'client') summary.clients.push(transformed);
      else if (item.name === 'litigation') {
        if (transformed.category === 'Tribunal' && tribunalRecords.length > 0) {
          const isDup = tribunalRecords.some(t => 
            String(t.id) === String(transformed.id) ||
            (t.clientName && t.clientName.trim().toLowerCase() === (transformed.clientName||'').trim().toLowerCase() &&
             (t.noticeNo === transformed.noticeNo || t.orderNo === transformed.orderNo || t.replyReferenceNo === transformed.replyReferenceNo || t.hearingDate === transformed.hearingDate))
          );
          if (isDup) continue;
        }
        if (transformed.category === 'HighCourt' && highcourtRecords.length > 0) {
          const isDup = highcourtRecords.some(h => 
            String(h.id) === String(transformed.id) ||
            (h.clientName && h.clientName.trim().toLowerCase() === (transformed.clientName||'').trim().toLowerCase() &&
             (h.noticeNo === transformed.noticeNo || h.orderNo === transformed.orderNo || h.replyReferenceNo === transformed.replyReferenceNo || h.hearingDate === transformed.hearingDate))
          );
          if (isDup) continue;
        }
        summary.litigation.push(transformed);
      }
      else if (item.name === 'invoice') summary.invoices.push(transformed);
      else if (item.name === 'work') summary.work.push(transformed);
      else if (item.name === 'gstReg') summary.gstReg.push(transformed);
      else if (item.name === 'foodLic') summary.foodLic.push(transformed);
      else if (item.name === 'msme') summary.msme.push(transformed);
      else if (item.name === 'payment') summary.payments.push(transformed);
      else if (item.name.startsWith('app_data_')) {
        const key = item.name.replace('app_data_', '');
        filingDataCache[key] = item.data || {};
      }
    }

    const existingLitIds = new Set(summary.litigation.map(l => String(l.id)));
    for (const t of tribunalRecords) {
      if (!existingLitIds.has(String(t.id))) {
        summary.litigation.push(t);
      }
    }
    for (const h of highcourtRecords) {
      if (!existingLitIds.has(String(h.id))) {
        summary.litigation.push(h);
      }
    }

    res.json({ summary, filingDataCache });
  } catch (err) {
    console.error('Get Dashboard Summary Error:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard summary data' });
  }
};

export const getMonthlyFilingData = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const appDataNames = [
      'app_data_clientify_monthly_filing_v3',
      'app_data_clientify_monthly_due_dates_v1'
    ];

    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: { $in: ['client', ...appDataNames] }
    }).toArray();

    const clients = [];
    let filingData = {};
    let dueDates = {};

    for (const item of rawItems) {
      const transformed = {
        ...item.data,
        id: item._id,
        createdAt: item.createdAt
      };

      if (item.name === 'client') {
        const gp = transformed.gstProfile || {};
        const regType = (gp.regType || gp.registrationType || 'Regular').toString().toLowerCase();
        const filingFreq = (gp.filingFreq || gp.filingFrequency || 'Monthly').toString().toLowerCase();
        if (regType !== 'composition' && filingFreq !== 'quarterly') {
          clients.push(transformed);
        }
      } else if (item.name === 'app_data_clientify_monthly_filing_v3') {
        filingData = item.data || {};
      } else if (item.name === 'app_data_clientify_monthly_due_dates_v1') {
        dueDates = item.data || {};
      }
    }

    res.json({ clients, filingData, dueDates });
  } catch (err) {
    console.error('Get Monthly Filing Data Error:', err);
    res.status(500).json({ error: 'Failed to retrieve monthly filing data' });
  }
};

export const getQuarterlyFilingData = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const appDataNames = [
      'app_data_clientify_quarterly_filing_v3',
      'app_data_clientify_quarterly_due_dates_v1'
    ];

    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: { $in: ['client', ...appDataNames] }
    }).toArray();

    const clients = [];
    let filingData = {};
    let dueDates = {};

    for (const item of rawItems) {
      const transformed = {
        ...item.data,
        id: item._id,
        createdAt: item.createdAt
      };

      if (item.name === 'client') {
        const gp = transformed.gstProfile || {};
        const regType = (gp.regType || gp.registrationType || 'Regular').toString().toLowerCase();
        const filingFreq = (gp.filingFreq || gp.filingFrequency || '').toString().toLowerCase();
        if (regType !== 'composition' && filingFreq === 'quarterly') {
          clients.push(transformed);
        }
      } else if (item.name === 'app_data_clientify_quarterly_filing_v3') {
        filingData = item.data || {};
      } else if (item.name === 'app_data_clientify_quarterly_due_dates_v1') {
        dueDates = item.data || {};
      }
    }

    res.json({ clients, filingData, dueDates });
  } catch (err) {
    console.error('Get Quarterly Filing Data Error:', err);
    res.status(500).json({ error: 'Failed to retrieve quarterly filing data' });
  }
};

export const getCompositionFilingData = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const appDataNames = [
      'app_data_clientify_composition_filing_v3',
      'app_data_clientify_composition_due_dates_v1'
    ];

    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: { $in: ['client', ...appDataNames] }
    }).toArray();

    const clients = [];
    let filingData = {};
    let dueDates = {};

    for (const item of rawItems) {
      const transformed = {
        ...item.data,
        id: item._id,
        createdAt: item.createdAt
      };

      if (item.name === 'client') {
        const gp = transformed.gstProfile || {};
        const regType = (gp.regType || gp.registrationType || gp.taxpayerType || '').toString().toLowerCase();
        if (regType === 'composition') {
          clients.push(transformed);
        }
      } else if (item.name === 'app_data_clientify_composition_filing_v3') {
        filingData = item.data || {};
      } else if (item.name === 'app_data_clientify_composition_due_dates_v1') {
        dueDates = item.data || {};
      }
    }

    res.json({ clients, filingData, dueDates });
  } catch (err) {
    console.error('Get Composition Filing Data Error:', err);
    res.status(500).json({ error: 'Failed to retrieve composition filing data' });
  }
};

export const getGSTR4FilingData = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const appDataNames = [
      'app_data_clientify_gstr4_filing_v1',
      'app_data_clientify_gstr4_due_dates_v1',
      'app_data_clientify_composition_filing_v3'
    ];

    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: { $in: ['client', ...appDataNames] }
    }).toArray();

    const clients = [];
    let filingData = {};
    let dueDates = {};
    let cmp08Data = {};

    for (const item of rawItems) {
      const transformed = {
        ...item.data,
        id: item._id,
        createdAt: item.createdAt
      };

      if (item.name === 'client') {
        const gp = transformed.gstProfile || {};
        const regType = (gp.regType || gp.registrationType || gp.taxpayerType || '').toString().toLowerCase();
        if (regType === 'composition') {
          clients.push(transformed);
        }
      } else if (item.name === 'app_data_clientify_gstr4_filing_v1') {
        filingData = item.data || {};
      } else if (item.name === 'app_data_clientify_gstr4_due_dates_v1') {
        dueDates = item.data || {};
      } else if (item.name === 'app_data_clientify_composition_filing_v3') {
        cmp08Data = item.data || {};
      }
    }

    res.json({ clients, filingData, dueDates, cmp08Data });
  } catch (err) {
    console.error('Get GSTR-4 Filing Data Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GSTR-4 filing data' });
  }
};

export const getGSTR9FilingData = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const appDataNames = [
      'app_data_clientify_gstr9_watchlist_v2',
      'app_data_clientify_gstr9_config_v2',
      'app_data_clientify_gstr9_filing_data_v2',
      'app_data_clientify_gstr9_due_dates_v2'
    ];

    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: { $in: ['client', ...appDataNames] }
    }).toArray();

    const clients = [];
    let watchlist = {};
    let config = {};
    let filingData = {};
    let dueDates = {};

    for (const item of rawItems) {
      const transformed = {
        ...item.data,
        id: item._id,
        createdAt: item.createdAt
      };

      if (item.name === 'client') {
        clients.push(transformed);
      } else if (item.name === 'app_data_clientify_gstr9_watchlist_v2') {
        watchlist = item.data || {};
      } else if (item.name === 'app_data_clientify_gstr9_config_v2') {
        config = item.data || {};
      } else if (item.name === 'app_data_clientify_gstr9_filing_data_v2') {
        filingData = item.data || {};
      } else if (item.name === 'app_data_clientify_gstr9_due_dates_v2') {
        dueDates = item.data || {};
      }
    }

    res.json({ clients, watchlist, config, filingData, dueDates });
  } catch (err) {
    console.error('Get GSTR-9 Filing Data Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GSTR-9 filing data' });
  }
};

export const getITRReturnFilingData = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const appDataNames = [
      'app_data_clientify_itr_filing_data_v2',
      'app_data_clientify_itr_due_dates_v1'
    ];

    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: { $in: ['client', ...appDataNames] }
    }).toArray();

    const clients = [];
    let filingData = {};
    let dueDates = {};

    for (const item of rawItems) {
      const transformed = {
        ...item.data,
        id: item._id,
        createdAt: item.createdAt
      };

      if (item.name === 'client') {
        if (transformed.itProfile) {
          clients.push(transformed);
        }
      } else if (item.name === 'app_data_clientify_itr_filing_data_v2') {
        filingData = item.data || {};
      } else if (item.name === 'app_data_clientify_itr_due_dates_v1') {
        dueDates = item.data || {};
      }
    }

    res.json({ clients, filingData, dueDates });
  } catch (err) {
    console.error('Get ITR Return Filing Data Error:', err);
    res.status(500).json({ error: 'Failed to retrieve ITR return filing data' });
  }
};

export const getTaxAuditFilingData = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const appDataNames = [
      'app_data_clientify_audit_watchlist_v3',
      'app_data_clientify_audit_fin_data_v3',
      'app_data_clientify_audit_due_dates_v1'
    ];

    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: { $in: ['client', ...appDataNames] }
    }).toArray();

    const clients = [];
    let watchlist = {};
    let filingData = {};
    let dueDates = {};

    for (const item of rawItems) {
      const transformed = {
        ...item.data,
        id: item._id,
        createdAt: item.createdAt
      };

      if (item.name === 'client') {
        clients.push(transformed);
      } else if (item.name === 'app_data_clientify_audit_watchlist_v3') {
        watchlist = item.data || {};
      } else if (item.name === 'app_data_clientify_audit_fin_data_v3') {
        filingData = item.data || {};
      } else if (item.name === 'app_data_clientify_audit_due_dates_v1') {
        dueDates = item.data || {};
      }
    }

    res.json({ clients, watchlist, filingData, dueDates });
  } catch (err) {
    console.error('Get Tax Audit Filing Data Error:', err);
    res.status(500).json({ error: 'Failed to retrieve Tax Audit filing data' });
  }
};

export const getLitigationFilingData = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: { $in: ['client', 'litigation'] }
    }).toArray();

    const clients = [];
    const litigation = [];

    for (const item of rawItems) {
      const transformed = {
        ...item.data,
        id: item._id,
        createdAt: item.createdAt
      };

      if (item.name === 'client') {
        clients.push(transformed);
      } else if (item.name === 'litigation') {
        litigation.push(transformed);
      }
    }

    res.json({ clients, litigation });
  } catch (err) {
    console.error('Get Litigation Data Error:', err);
    res.status(500).json({ error: 'Failed to retrieve litigation data' });
  }
};

export const getMessengerClientsAll = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: 'client'
    }).toArray();

    const clients = rawItems.map(item => ({
      ...item.data,
      id: item._id,
      createdAt: item.createdAt
    }));

    res.json(clients);
  } catch (err) {
    console.error('Get Messenger Clients All Error:', err);
    res.status(500).json({ error: 'Failed to retrieve clients' });
  }
};

export const getMessengerClientsGst = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: 'client',
      $or: [
        { 'data.gstProfile.gstin': { $exists: true, $ne: '' } },
        { 'data.services': 'GST' },
        { 'data.gstProfile.regType': { $exists: true, $ne: '' } }
      ]
    }).toArray();

    const clients = rawItems.map(item => ({
      ...item.data,
      id: item._id,
      createdAt: item.createdAt
    }));

    res.json(clients);
  } catch (err) {
    console.error('Get Messenger Clients Gst Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST clients' });
  }
};

export const getMessengerClientsItr = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: 'client',
      $or: [
        { 'data.itProfile.pan': { $exists: true, $ne: '' } },
        { 'data.services': 'IT' },
        { 'data.services': 'ITR' },
        { 'data.itProfile.fileType': { $exists: true, $ne: '' } }
      ]
    }).toArray();

    const clients = rawItems.map(item => ({
      ...item.data,
      id: item._id,
      createdAt: item.createdAt
    }));

    res.json(clients);
  } catch (err) {
    console.error('Get Messenger Clients Itr Error:', err);
    res.status(500).json({ error: 'Failed to retrieve ITR clients' });
  }
};

export const getMessengerClientsAudit = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: 'client',
      $or: [
        { 'data.itProfile.auditApplicable': true },
        { 'data.itProfile.advisoryWork.taxAudit': true },
        { 'data.services': 'Audit' },
        { 'data.itProfile.fileType': { $regex: /audit/i } }
      ]
    }).toArray();

    const clients = rawItems.map(item => ({
      ...item.data,
      id: item._id,
      createdAt: item.createdAt
    }));

    res.json(clients);
  } catch (err) {
    console.error('Get Messenger Clients Audit Error:', err);
    res.status(500).json({ error: 'Failed to retrieve Audit clients' });
  }
};

export const getMessengerClientsGstr4 = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const rawItems = await itemsColl.find({
      createdBy: { $in: userMatches },
      name: 'client',
      'data.gstProfile.regType': 'Composition'
    }).toArray();

    const clients = rawItems.map(item => ({
      ...item.data,
      id: item._id,
      createdAt: item.createdAt
    }));

    res.json(clients);
  } catch (err) {
    console.error('Get Messenger Clients Gstr4 Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GSTR-4 clients' });
  }
};

export const getMessengerClientsGstr9 = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    
    // Attempt to load GSTR-9 watchlist
    const watchlistDoc = await itemsColl.findOne({
      createdBy: { $in: userMatches },
      name: 'app_data_clientify_gstr9_watchlist_v2'
    });
    
    const watchlistObj = watchlistDoc ? watchlistDoc.data : {};
    const watchlistIds = [];
    if (watchlistObj) {
      Object.values(watchlistObj).forEach(arr => {
        if (Array.isArray(arr)) {
          arr.forEach(id => {
            try {
              watchlistIds.push(new ObjectId(id));
            } catch (e) {
              watchlistIds.push(id);
            }
          });
        }
      });
    }

    const query = {
      createdBy: { $in: userMatches },
      name: 'client',
      $or: [
        { _id: { $in: watchlistIds } },
        { 'data.gstProfile.gstin': { $exists: true, $ne: '' } }
      ]
    };

    const rawItems = await itemsColl.find(query).toArray();

    const clients = rawItems.map(item => ({
      ...item.data,
      id: item._id,
      createdAt: item.createdAt
    }));

    res.json(clients);
  } catch (err) {
    console.error('Get Messenger Clients Gstr9 Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GSTR-9 clients' });
  }
};

export const getRemindersLitigation = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }
    const litColl = getCollection('litigation');
    const rawLit = await litColl.find({
      createdBy: { $in: userMatches },
      'status': 'Pending'
    }).toArray();
    
    let records = rawLit;
    if (records.length === 0) {
      const oldLit = await getCollection('items').find({
        createdBy: { $in: userMatches },
        name: 'litigation',
        'data.status': 'Pending'
      }).toArray();
      records = oldLit.map(item => ({ ...item.data, id: item._id }));
    } else {
      records = records.map(item => ({ ...item, id: item._id }));
    }

    res.json(records);
  } catch (err) {
    console.error('Get Reminders Litigation Error:', err);
    res.status(500).json({ error: 'Failed to retrieve litigation reminders' });
  }
};

export const getRemindersWork = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }
    const workColl = getCollection('misc_work');
    const rawWork = await workColl.find({
      createdBy: { $in: userMatches },
      'status': { $ne: 'Completed' }
    }).toArray();

    let records = rawWork;
    if (records.length === 0) {
      const oldWork = await getCollection('items').find({
        createdBy: { $in: userMatches },
        name: 'misc_work',
        'data.status': { $ne: 'Completed' }
      }).toArray();
      records = oldWork.map(item => ({ ...item.data, id: item._id }));
    } else {
      records = records.map(item => ({ ...item, id: item._id }));
    }

    res.json(records);
  } catch (err) {
    console.error('Get Reminders Work Error:', err);
    res.status(500).json({ error: 'Failed to retrieve misc work reminders' });
  }
};

export const getRemindersAll = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const litColl = getCollection('litigation');
    let rawLit = await litColl.find({
      createdBy: { $in: userMatches },
      'status': 'Pending'
    }).toArray();
    if (rawLit.length === 0) {
      const oldLit = await getCollection('items').find({
        createdBy: { $in: userMatches },
        name: 'litigation',
        'data.status': 'Pending'
      }).toArray();
      rawLit = oldLit.map(item => ({ ...item.data, id: item._id }));
    } else {
      rawLit = rawLit.map(item => ({ ...item, id: item._id }));
    }

    const workColl = getCollection('misc_work');
    let rawWork = await workColl.find({
      createdBy: { $in: userMatches },
      'status': { $ne: 'Completed' }
    }).toArray();
    if (rawWork.length === 0) {
      const oldWork = await getCollection('items').find({
        createdBy: { $in: userMatches },
        name: 'misc_work',
        'data.status': { $ne: 'Completed' }
      }).toArray();
      rawWork = oldWork.map(item => ({ ...item.data, id: item._id }));
    } else {
      rawWork = rawWork.map(item => ({ ...item, id: item._id }));
    }

    res.json({ litigation: rawLit, work: rawWork });
  } catch (err) {
    console.error('Get Reminders All Error:', err);
    res.status(500).json({ error: 'Failed to retrieve reminders' });
  }
};

// --- Dedicated GST Notice & GST Appeal Controllers ---

const fetchSpecificLitigation = async (req, isAppeal, status) => {
  const userMatches = [req.user._id];
  if (req.user._id) {
    userMatches.push(req.user._id.toString());
    if (ObjectId.isValid(req.user._id)) {
      try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
    }
  }

  const itemsColl = getCollection('items');

  // Built highly-targeted litigation query (MongoDB equivalent of SELECT)
  const litigationQuery = {
    createdBy: { $in: userMatches },
    name: 'litigation',
    'data.category': isAppeal ? 'Appeal' : { $ne: 'Appeal' }
  };

  // Status mapping
  if (status === 'Pending') {
    litigationQuery['data.status'] = 'Pending';
  } else if (status === 'Filed') {
    litigationQuery['data.status'] = 'Filed';
  } else if (status === 'Demand') {
    if (isAppeal) {
      litigationQuery['data.status'] = { $in: ['Demand', 'Demand Sustain', 'Demand Sustained'] };
    } else {
      litigationQuery['data.status'] = 'Demand';
    }
  } else if (status === 'Drop') {
    litigationQuery['data.status'] = { $in: ['Drop', 'Dropped'] };
  }

  const rawLitigation = await itemsColl.find(litigationQuery).toArray();

  const litigation = rawLitigation.map(item => ({
    ...item.data,
    id: item._id,
    createdAt: item.createdAt
  }));

  const rawClients = await itemsColl.find({ createdBy: { $in: userMatches }, name: 'client' }).toArray();

  const clients = rawClients.map(item => ({
    ...item.data,
    id: item._id,
    createdAt: item.createdAt
  }));

  return { clients, litigation };
};

export const getGstNoticePending = async (req, res) => {
  try {
    const data = await fetchSpecificLitigation(req, false, 'Pending');
    res.json(data);
  } catch (err) {
    console.error('Get GST Notice Pending Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST Notice Pending records' });
  }
};

export const getGstNoticeFiled = async (req, res) => {
  try {
    const data = await fetchSpecificLitigation(req, false, 'Filed');
    res.json(data);
  } catch (err) {
    console.error('Get GST Notice Filed Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST Notice Filed records' });
  }
};

export const getGstNoticeDemand = async (req, res) => {
  try {
    const data = await fetchSpecificLitigation(req, false, 'Demand');
    res.json(data);
  } catch (err) {
    console.error('Get GST Notice Demand Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST Notice Demand records' });
  }
};

export const getGstNoticeDrop = async (req, res) => {
  try {
    const data = await fetchSpecificLitigation(req, false, 'Drop');
    res.json(data);
  } catch (err) {
    console.error('Get GST Notice Drop Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST Notice Drop records' });
  }
};

export const getGstAppealPending = async (req, res) => {
  try {
    const data = await fetchSpecificLitigation(req, true, 'Pending');
    res.json(data);
  } catch (err) {
    console.error('Get GST Appeal Pending Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST Appeal Pending records' });
  }
};

export const getGstAppealFiled = async (req, res) => {
  try {
    const data = await fetchSpecificLitigation(req, true, 'Filed');
    res.json(data);
  } catch (err) {
    console.error('Get GST Appeal Filed Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST Appeal Filed records' });
  }
};

export const getGstAppealDemand = async (req, res) => {
  try {
    const data = await fetchSpecificLitigation(req, true, 'Demand');
    res.json(data);
  } catch (err) {
    console.error('Get GST Appeal Demand Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST Appeal Demand records' });
  }
};

export const getGstAppealDrop = async (req, res) => {
  try {
    const data = await fetchSpecificLitigation(req, true, 'Drop');
    res.json(data);
  } catch (err) {
    console.error('Get GST Appeal Drop Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST Appeal Drop records' });
  }
};

// --- Dedicated GST Portfolio & IT Portfolio Client Controllers ---

export const getGstClients = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const rawItems = await itemsColl.find({ 
      createdBy: { $in: userMatches }, 
      name: 'client'
    }).toArray();

    const gstClients = rawItems
      .map(item => ({ ...item.data, id: item._id, createdAt: item.createdAt }))
      .filter(c => c && (c.gstProfile || Boolean(c.gstProfile?.gstin)));

    res.json(gstClients);
  } catch (err) {
    console.error('Get GST Clients Error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST clients' });
  }
};

export const getItClients = async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }

    const itemsColl = getCollection('items');
    const rawItems = await itemsColl.find({ 
      createdBy: { $in: userMatches }, 
      name: 'client'
    }).toArray();

    const itClients = rawItems
      .map(item => ({ ...item.data, id: item._id, createdAt: item.createdAt }))
      .filter(c => c && (c.itProfile || Boolean(c.itProfile?.pan)));

    res.json(itClients);
  } catch (err) {
    console.error('Get IT Clients Error:', err);
    res.status(500).json({ error: 'Failed to retrieve IT clients' });
  }
};


