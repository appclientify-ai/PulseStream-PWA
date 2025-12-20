
import { getCollection } from '../db/mongo.js';

export const createItem = async (req, res) => {
  const { name, data } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Item name is required' });
  }

  try {
    const items = getCollection('items');
    const newItem = {
      name,
      data: data || {},
      createdBy: req.user._id, // Tied to the logged-in user
      creatorName: req.user.username,
      createdAt: new Date()
    };

    const result = await items.insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (err) {
    console.error('Create Item Error:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
};

export const getItems = async (req, res) => {
  try {
    // SECURITY: Only return items created by this specific user
    const items = await getCollection('items')
      .find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    res.json(items);
  } catch (err) {
    console.error('Get Items Error:', err);
    res.status(500).json({ error: 'Failed to fetch your items' });
  }
};
