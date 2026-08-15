import { getCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

const buildQuery = (id, userId) => {
  const matches = [id];
  if (id && ObjectId.isValid(id)) {
    try { matches.push(new ObjectId(id)); } catch (e) {}
  }
  const userMatches = [userId];
  if (userId) {
    userMatches.push(userId.toString());
    if (ObjectId.isValid(userId)) {
      try { userMatches.push(new ObjectId(userId)); } catch (e) {}
    }
  }
  return { _id: { $in: matches }, createdBy: { $in: userMatches } };
};

export const getLitigationRecords = (collectionName, litigationCategory) => async (req, res) => {
  try {
    const userMatches = [req.user._id];
    if (req.user._id) {
      userMatches.push(req.user._id.toString());
      if (ObjectId.isValid(req.user._id)) {
        try { userMatches.push(new ObjectId(req.user._id)); } catch (e) {}
      }
    }
    const collection = getCollection(collectionName);
    const query = { createdBy: { $in: userMatches } };
    
    const count = collection.countDocuments 
      ? await collection.countDocuments(query) 
      : (await collection.find(query).toArray()).length;
      
    if (litigationCategory) {
      const oldItems = await getCollection('items').find({ 
        name: 'litigation',
        'data.category': litigationCategory,
        createdBy: { $in: userMatches }
      }).toArray();
      
      if (count === 0 && oldItems.length > 0) {
        const migrated = oldItems.map(item => ({
          ...item.data,
          createdBy: item.createdBy,
          creatorName: item.creatorName,
          createdAt: item.createdAt || new Date(),
          updatedAt: item.updatedAt || new Date()
        }));
        await collection.insertMany(migrated);
        await getCollection('items').deleteMany({
          _id: { $in: oldItems.map(i => i._id) }
        });
      } else if (count > 0 && oldItems.length > 0) {
        await getCollection('items').deleteMany({
          _id: { $in: oldItems.map(i => i._id) }
        });
      }
    }

    const items = await collection.find(query).sort({ updatedAt: -1 }).toArray();
    res.json(items);
  } catch (err) {
    console.error(`Get Records Error for ${collectionName}:`, err);
    res.status(500).json({ error: 'Failed to retrieve records' });
  }
};

export const createLitigationRecord = (collectionName) => async (req, res) => {
  try {
    const collection = getCollection(collectionName);
    const newRecord = {
      ...req.body,
      createdBy: req.user._id,
      creatorName: req.user.username,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    delete newRecord._id;
    delete newRecord.id;
    const result = await collection.insertOne(newRecord);
    const insertedId = result.insertedId || (result.value ? result.value._id : null);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'insert', collection: collectionName, timestamp: new Date() });
    }
    res.status(201).json({ ...newRecord, _id: insertedId, id: insertedId });
  } catch (err) {
    console.error(`Create Record Error for ${collectionName}:`, err);
    res.status(500).json({ error: 'Failed to create record' });
  }
};

export const updateLitigationRecord = (collectionName) => async (req, res) => {
  const { id } = req.params;
  try {
    const collection = getCollection(collectionName);
    const query = buildQuery(id, req.user._id);
    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData._id;
    delete updateData.id;
    
    const result = await collection.findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    const unwrapped = result && result.value ? result.value : result;
    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'update', collection: collectionName, id, timestamp: new Date() });
    }
    res.json(unwrapped);
  } catch (err) {
    console.error(`Update Record Error for ${collectionName}:`, err);
    res.status(500).json({ error: 'Failed to update record' });
  }
};

export const deleteLitigationRecord = (collectionName) => async (req, res) => {
  const { id } = req.params;
  try {
    const collection = getCollection(collectionName);
    const query = buildQuery(id, req.user._id);
    await collection.deleteOne(query);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'delete', collection: collectionName, id, timestamp: new Date() });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(`Delete Record Error for ${collectionName}:`, err);
    res.status(500).json({ error: 'Failed to delete record' });
  }
};
