
import { getCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

export const getInvoices = async (req, res) => {
  try {
    const invoices = await getCollection('invoices')
      .find({ firmId: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const generateNextInvoiceNo = async (req, res) => {
  try {
    const settings = await getCollection('settings').findOne({ firmId: req.user._id, type: 'invoice' });
    const prefix = settings?.data?.invoicePrefix || 'INV/';
    
    const count = await getCollection('invoices').countDocuments({ firmId: req.user._id });
    const nextNo = `${prefix}${new Date().getFullYear()}/${(count + 1).toString().padStart(3, '0')}`;
    res.json({ nextNo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate invoice number' });
  }
};

export const saveInvoice = async (req, res) => {
  const invoiceData = req.body;
  const invoices = getCollection('invoices');
  
  try {
    if (invoiceData.id || invoiceData._id) {
      const id = invoiceData.id || invoiceData._id;
      delete invoiceData.id;
      delete invoiceData._id;
      
      await invoices.updateOne(
        { _id: new ObjectId(id), firmId: req.user._id },
        { $set: { ...invoiceData, updatedAt: new Date() } }
      );
      res.json({ success: true, id });
    } else {
      const result = await invoices.insertOne({
        ...invoiceData,
        firmId: req.user._id,
        createdAt: new Date()
      });
      res.status(201).json({ success: true, id: result.insertedId });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save invoice' });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    await getCollection('invoices').deleteOne({
      _id: new ObjectId(req.params.id),
      firmId: req.user._id
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};
