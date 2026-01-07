
import express from 'express';
import { getCollection } from '../db/mongo.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

// Fetch filings for a specific period
router.get('/:type', authenticate, async (req, res) => {
  const { type } = req.params; // monthly, quarterly, annual
  const { year, period } = req.query;
  
  try {
    const data = await getCollection('filings').findOne({
      firmId: req.user._id,
      type,
      year,
      period
    });
    res.json(data?.clients || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch filing data' });
  }
});

// Update status for a client in a period
router.post('/:type', authenticate, async (req, res) => {
  const { type } = req.params;
  const { year, period, clientId, status } = req.body;

  try {
    const query = { firmId: req.user._id, type, year, period };
    const update = { 
      $set: { [`clients.${clientId}`]: status, updatedAt: new Date() } 
    };
    
    await getCollection('filings').updateOne(query, update, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync status' });
  }
});

export default router;
