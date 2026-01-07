
import { getCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

export const getLitigation = async (req, res) => {
  try {
    const records = await getCollection('litigation')
      .find({ firmId: req.user._id })
      .sort({ dueDate: 1 })
      .toArray();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch litigation vault' });
  }
};

export const saveLitigation = async (req, res) => {
  const data = req.body;
  const litigation = getCollection('litigation');
  
  try {
    if (data.id || data._id) {
      const id = data.id || data._id;
      delete data.id;
      delete data._id;
      
      await litigation.updateOne(
        { _id: new ObjectId(id), firmId: req.user._id },
        { $set: { ...data, updatedAt: new Date() } }
      );
      res.json({ success: true, id });
    } else {
      const result = await litigation.insertOne({
        ...data,
        firmId: req.user._id,
        createdAt: new Date()
      });
      res.status(201).json({ success: true, id: result.insertedId });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save litigation record' });
  }
};

export const deleteLitigation = async (req, res) => {
  try {
    await getCollection('litigation').deleteOne({
      _id: new ObjectId(req.params.id),
      firmId: req.user._id
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record' });
  }
};
