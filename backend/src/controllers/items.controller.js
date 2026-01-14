
import { getCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

export const getItems = async (req, res) => {
  try {
    const items = await getCollection('items')
      .find({ createdBy: req.user._id }) // CRITICAL: Strict ownership
      .sort({ updatedAt: -1 })
      .toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve vault records' });
  }
};

export const createItem = async (req, res) => {
  try {
    const newItem = {
      ...req.body,
      createdBy: req.user._id, // Auto-attach owner
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await getCollection('items').insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive record' });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getCollection('items').findOneAndUpdate(
      { _id: new ObjectId(id), createdBy: req.user._id },
      { $set: { ...req.body, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
};
