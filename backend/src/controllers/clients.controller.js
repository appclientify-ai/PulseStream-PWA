
import { getCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

export const getClients = async (req, res) => {
  try {
    const clients = await getCollection('clients')
      .find({ firmId: req.user._id })
      .sort({ legalName: 1 })
      .toArray();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

export const saveClient = async (req, res) => {
  const clientData = req.body;
  const clients = getCollection('clients');
  
  try {
    if (clientData.id || clientData._id) {
      const id = clientData.id || clientData._id;
      delete clientData.id;
      delete clientData._id;
      
      await clients.updateOne(
        { _id: new ObjectId(id), firmId: req.user._id },
        { $set: clientData }
      );
      res.json({ success: true, id });
    } else {
      const result = await clients.insertOne({
        ...clientData,
        firmId: req.user._id,
        createdAt: new Date()
      });
      res.status(201).json({ success: true, id: result.insertedId });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save client' });
  }
};

export const deleteClient = async (req, res) => {
  try {
    await getCollection('clients').deleteOne({
      _id: new ObjectId(req.params.id),
      firmId: req.user._id
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
};
