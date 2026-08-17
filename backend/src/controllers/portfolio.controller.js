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

// --- GST Portfolio ---
export const getGSTPortfolio = async (req, res) => {
  try {
    const items = getCollection('items');
    const userMatches = getUserMatches(req.user._id);
    const clients = await items.find({
      name: 'client',
      createdBy: { $in: userMatches }
    }).toArray();

    // Map to client format
    const transformed = clients.map(c => ({
      ...c.data,
      id: c._id ? c._id.toString() : c.id,
      _id: c._id ? c._id.toString() : c.id,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    res.json(transformed);
  } catch (err) {
    console.error('getGSTPortfolio error:', err);
    res.status(500).json({ error: 'Failed to retrieve GST portfolio' });
  }
};

// --- IT Portfolio ---
export const getITPortfolio = async (req, res) => {
  try {
    const items = getCollection('items');
    const userMatches = getUserMatches(req.user._id);
    const clients = await items.find({
      name: 'client',
      createdBy: { $in: userMatches }
    }).toArray();

    const transformed = clients.map(c => ({
      ...c.data,
      id: c._id ? c._id.toString() : c.id,
      _id: c._id ? c._id.toString() : c.id,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));

    res.json(transformed);
  } catch (err) {
    console.error('getITPortfolio error:', err);
    res.status(500).json({ error: 'Failed to retrieve IT portfolio' });
  }
};

// --- Single Client Details ---
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const items = getCollection('items');
    const query = buildQuery(id, req.user._id);
    const client = await items.findOne(query);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({
      ...client.data,
      id: client._id ? client._id.toString() : client.id,
      _id: client._id ? client._id.toString() : client.id,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve client' });
  }
};

export const saveClient = async (req, res) => {
  try {
    const clientData = req.body;
    const items = getCollection('items');
    const id = req.params.id || clientData.id || clientData._id;

    if (id) {
      const query = buildQuery(id, req.user._id);
      const updateData = {
        data: clientData,
        updatedAt: new Date()
      };
      const result = await items.findOneAndUpdate(
        query,
        { $set: updateData },
        { returnDocument: 'after' }
      );
      const updated = result.value || result;
      
      const io = req.app.get('io');
      if (io) {
        io.emit('db_item_change', { type: 'update', collection: 'clients', id, data: clientData, timestamp: new Date() });
      }

      return res.json({
        ...clientData,
        id: updated._id ? updated._id.toString() : id,
        _id: updated._id ? updated._id.toString() : id
      });
    } else {
      const newDoc = {
        name: 'client',
        data: clientData,
        createdBy: req.user._id,
        creatorName: req.user.username,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await items.insertOne(newDoc);
      const insertedId = (result.insertedId || result._id).toString();

      const io = req.app.get('io');
      if (io) {
        io.emit('db_item_change', { type: 'insert', collection: 'clients', id: insertedId, data: clientData, timestamp: new Date() });
      }

      return res.status(201).json({
        ...clientData,
        id: insertedId,
        _id: insertedId
      });
    }
  } catch (err) {
    console.error('saveClient error:', err);
    res.status(500).json({ error: 'Failed to save client' });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const items = getCollection('items');
    const query = buildQuery(id, req.user._id);
    await items.deleteOne(query);

    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'delete', collection: 'clients', id, timestamp: new Date() });
    }

    res.json({ success: true, message: 'Client removed', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
};
