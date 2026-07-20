import { getCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

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
    // Return all items belonging to the authenticated user
    const items = await getCollection('items')
      .find({ createdBy: req.user._id })
      .sort({ updatedAt: -1 })
      .toArray();
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
    const result = await items.findOneAndUpdate(
      { 
        _id: new ObjectId(id), 
        createdBy: req.user._id 
      },
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
    const result = await items.deleteOne({ 
      _id: new ObjectId(id), 
      createdBy: req.user._id 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Record not found or unauthorized' });
    }

    
    
    // Unwrap the result if it's nested
    if (result && result.value) {
      result = result.value;
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
