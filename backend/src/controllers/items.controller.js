
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
    
    /**
     * Note: Manual socket emission is removed here. 
     * The initChangeStreams logic in server.js detects this insert 
     * and broadcasts it to all clients, ensuring consistency even if 
     * the item was created by another process or manual DB edit.
     */
    
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (err) {
    console.error('Create Item Error:', err);
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
    console.error('Get Items Error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};
