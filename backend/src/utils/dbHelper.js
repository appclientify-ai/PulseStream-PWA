import { getCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

export const updateAndEmit = async (req, collectionName, query, updateData, module, clientId) => {
  const collection = getCollection(collectionName);
  
  const result = await collection.findOneAndUpdate(
    query,
    { $set: updateData },
    { returnDocument: 'after', upsert: true }
  );

  const updatedData = result.value || result;

  const io = req.app.get('io');
  if (io) {
    io.emit('DATA_MUTATED', { module, clientId, data: updatedData });
  }

  return updatedData;
};
