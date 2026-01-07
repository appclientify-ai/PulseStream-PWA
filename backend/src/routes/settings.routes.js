
import express from 'express';
import { getSettings, saveSettings, getCollection } from '../controllers/settings.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();

router.get('/invoice', authenticate, async (req, res) => {
  const settings = await getSettings(req.user._id, 'invoice');
  res.json(settings || { firmName: req.user.firm_name || '', isGstEnabled: true });
});

router.post('/invoice', authenticate, async (req, res) => {
  await saveSettings(req.user._id, 'invoice', req.body);
  res.json({ success: true });
});

router.get('/compliance-dates', authenticate, async (req, res) => {
  const data = await getSettings(req.user._id, 'compliance-dates');
  res.json(data || {});
});

router.post('/compliance-dates', authenticate, async (req, res) => {
  const { key, value } = req.body;
  const current = await getSettings(req.user._id, 'compliance-dates') || {};
  await saveSettings(req.user._id, 'compliance-dates', { ...current, [key]: value });
  res.json({ success: true });
});

router.get('/gstr9-watchlist', authenticate, async (req, res) => {
  const data = await getSettings(req.user._id, 'gstr9-watchlist');
  res.json(data || {});
});

router.post('/gstr9-watchlist', authenticate, async (req, res) => {
  const { year, clientId } = req.body;
  const current = await getSettings(req.user._id, 'gstr9-watchlist') || {};
  const yearList = current[year] || [];
  if (!yearList.includes(clientId)) {
    yearList.push(clientId);
  }
  await saveSettings(req.user._id, 'gstr9-watchlist', { ...current, [year]: yearList });
  res.json({ success: true });
});

export default router;
