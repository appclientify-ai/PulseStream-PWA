
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
      createdBy: req.user._id,
      creatorName: req.user.username,
      createdAt: new Date()
    };

    const result = await items.insertOne(newItem);
    const itemWithId = { ...newItem, _id: result.insertedId };

    // Emit real-time event via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('item_created', itemWithId);
    }

    res.status(201).json(itemWithId);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create item' });
  }
};

export const getItems = async (req, res) => {
  try {
    const items = await getCollection('items')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};
