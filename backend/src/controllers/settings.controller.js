
import { getCollection } from '../db/mongo.js';

export const getSettings = async (firmId, type) => {
  const settings = await getCollection('settings').findOne({ firmId, type });
  return settings?.data;
};

export const saveSettings = async (firmId, type, data) => {
  await getCollection('settings').updateOne(
    { firmId, type },
    { $set: { data, updatedAt: new Date() } },
    { upsert: true }
  );
};
