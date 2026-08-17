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

const buildQuery = (id, userId) => {
  const matches = [id];
  if (id && ObjectId.isValid(id)) {
    try { matches.push(new ObjectId(id)); } catch (e) {}
  }
  const userMatches = getUserMatches(userId);
  return { _id: { $in: matches }, createdBy: { $in: userMatches } };
};

// ==========================================
// 1. INVOICES
// ==========================================
export const getInvoices = async (req, res) => {
  try {
    const items = getCollection('items');
    const userMatches = getUserMatches(req.user._id);
    const docs = await items.find({
      name: 'invoice',
      createdBy: { $in: userMatches }
    }).sort({ createdAt: -1 }).toArray();

    const transformed = docs.map(d => ({
      ...d.data,
      id: d._id ? d._id.toString() : d.id,
      _id: d._id ? d._id.toString() : d.id,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    }));

    res.json(transformed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve invoices' });
  }
};

export const saveInvoice = async (req, res) => {
  try {
    const data = req.body;
    const items = getCollection('items');
    const id = req.params.id || data.id || data._id;

    if (id) {
      const query = buildQuery(id, req.user._id);
      const updateData = { data, updatedAt: new Date() };
      const result = await items.findOneAndUpdate(query, { $set: updateData }, { returnDocument: 'after' });
      const updated = result.value || result;

      const io = req.app.get('io');
      if (io) {
        io.emit('db_item_change', { type: 'update', collection: 'invoices', id, data, timestamp: new Date() });
      }

      return res.json({ ...data, id: updated._id ? updated._id.toString() : id, _id: updated._id ? updated._id.toString() : id });
    } else {
      const newDoc = {
        name: 'invoice',
        data,
        createdBy: req.user._id,
        creatorName: req.user.username,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await items.insertOne(newDoc);
      const insertedId = (result.insertedId || result._id).toString();

      const io = req.app.get('io');
      if (io) {
        io.emit('db_item_change', { type: 'insert', collection: 'invoices', id: insertedId, data, timestamp: new Date() });
      }

      return res.status(201).json({ ...data, id: insertedId, _id: insertedId });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save invoice' });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const items = getCollection('items');
    const query = buildQuery(id, req.user._id);
    await items.deleteOne(query);

    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'delete', collection: 'invoices', id, timestamp: new Date() });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

// ==========================================
// 2. PAYMENTS
// ==========================================
export const getPayments = async (req, res) => {
  try {
    const items = getCollection('items');
    const userMatches = getUserMatches(req.user._id);
    const docs = await items.find({
      name: 'payment',
      createdBy: { $in: userMatches }
    }).sort({ createdAt: -1 }).toArray();

    const transformed = docs.map(d => ({
      ...d.data,
      id: d._id ? d._id.toString() : d.id,
      _id: d._id ? d._id.toString() : d.id,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    }));

    res.json(transformed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
};

export const savePayment = async (req, res) => {
  try {
    const data = req.body;
    const items = getCollection('items');
    const id = req.params.id || data.id || data._id;

    if (id) {
      const query = buildQuery(id, req.user._id);
      const updateData = { data, updatedAt: new Date() };
      const result = await items.findOneAndUpdate(query, { $set: updateData }, { returnDocument: 'after' });
      const updated = result.value || result;

      const io = req.app.get('io');
      if (io) {
        io.emit('db_item_change', { type: 'update', collection: 'payments', id, data, timestamp: new Date() });
      }

      return res.json({ ...data, id: updated._id ? updated._id.toString() : id, _id: updated._id ? updated._id.toString() : id });
    } else {
      const newDoc = {
        name: 'payment',
        data,
        createdBy: req.user._id,
        creatorName: req.user.username,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await items.insertOne(newDoc);
      const insertedId = (result.insertedId || result._id).toString();

      const io = req.app.get('io');
      if (io) {
        io.emit('db_item_change', { type: 'insert', collection: 'payments', id: insertedId, data, timestamp: new Date() });
      }

      return res.status(201).json({ ...data, id: insertedId, _id: insertedId });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save payment' });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const items = getCollection('items');
    const query = buildQuery(id, req.user._id);
    await items.deleteOne(query);

    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'delete', collection: 'payments', id, timestamp: new Date() });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};

// ==========================================
// 3. LEDGER FOR A CLIENT
// ==========================================
export const getClientLedger = async (req, res) => {
  try {
    const { clientId } = req.params;
    const items = getCollection('items');
    const userMatches = getUserMatches(req.user._id);

    const [invoices, payments] = await Promise.all([
      items.find({ name: 'invoice', createdBy: { $in: userMatches } }).toArray(),
      items.find({ name: 'payment', createdBy: { $in: userMatches } }).toArray()
    ]);

    const clientInvoices = invoices
      .map(i => ({ ...i.data, id: i._id.toString() }))
      .filter(i => !clientId || i.clientId === clientId || i.clientName === clientId);

    const clientPayments = payments
      .map(p => ({ ...p.data, id: p._id.toString() }))
      .filter(p => !clientId || p.clientId === clientId || p.clientName === clientId);

    const totalBilled = clientInvoices.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
    const totalPaid = clientPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const outstanding = totalBilled - totalPaid;

    res.json({
      clientId,
      invoices: clientInvoices,
      payments: clientPayments,
      summary: {
        totalBilled,
        totalPaid,
        outstanding
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute ledger' });
  }
};

// ==========================================
// 4. INVOICE SETTINGS
// ==========================================
export const getInvoiceSettings = async (req, res) => {
  try {
    const items = getCollection('items');
    const userMatches = getUserMatches(req.user._id);
    const doc = await items.findOne({ name: 'app_data_invoice_settings', createdBy: { $in: userMatches } });
    res.json(doc ? doc.data || {} : {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve invoice settings' });
  }
};

export const saveInvoiceSettings = async (req, res) => {
  try {
    const settings = req.body;
    const items = getCollection('items');
    const name = 'app_data_invoice_settings';
    
    await items.findOneAndUpdate(
      { name, createdBy: req.user._id },
      { 
        $set: { data: settings, updatedAt: new Date() },
        $setOnInsert: { name, createdBy: req.user._id, createdAt: new Date() }
      },
      { upsert: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'settings_update', name, timestamp: new Date() });
    }

    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save invoice settings' });
  }
};
