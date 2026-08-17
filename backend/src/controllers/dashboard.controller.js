import { getCollection } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

const getUserMatches = (userId) => {
  const userMatches = [userId];
  if (userId) {
    userMatches.push(userId.toString());
    if (ObjectId.isValid(userId)) {
      try { userMatches.push(new ObjectId(userId)); } catch (e) {}
    }
  }
  return userMatches;
};

export const getDashboardData = async (req, res) => {
  try {
    const userMatches = getUserMatches(req.user._id);

    const itemsColl = getCollection('items');
    const noticesColl = getCollection('litigation_notices');
    const appealsColl = getCollection('litigation_appeals');
    const tribunalColl = getCollection('tribunal_records');
    const highcourtColl = getCollection('highcourt_records');
    const foodColl = getCollection('food_licenses');
    const msmeColl = getCollection('msme_registrations');
    const gstRegColl = getCollection('gst_registrations');
    const miscWorkColl = getCollection('misc_work');

    const appDataKeys = [
      'monthly_filing_status',
      'clientify_monthly_filing_v3',
      'quarterly_filing_status',
      'clientify_quarterly_filing_v3',
      'composition_filing_status',
      'clientify_composition_filing_v3',
      'gstr4_filing_data',
      'clientify_gstr4_filing_v1',
      'gstr9_filing_data',
      'clientify_gstr9_filing_data_v2',
      'itr_filing_status_v1',
      'clientify_itr_filing_data_v2',
      'tax_audit_filing_status_v1',
      'clientify_audit_fin_data_v3',
      'gstr9_watchlist',
      'clientify_gstr9_watchlist_v2',
      'tax_audit_watchlist_v1'
    ];
    const appDataNames = appDataKeys.map(k => 'app_data_' + k);
    const categoryNames = ['client', 'litigation', 'invoice', 'work', 'gstReg', 'foodLic', 'msme', 'payment'];

    const query = {
      createdBy: { $in: userMatches },
      name: { $in: [...categoryNames, ...appDataNames] }
    };

    const [
      rawItems,
      rawNotices,
      rawAppeals,
      rawTribunal,
      rawHighCourt,
      rawFood,
      rawMsme,
      rawGstReg,
      rawMiscWork
    ] = await Promise.all([
      itemsColl.find(query).toArray(),
      noticesColl ? noticesColl.find({ createdBy: { $in: userMatches } }).toArray() : [],
      appealsColl ? appealsColl.find({ createdBy: { $in: userMatches } }).toArray() : [],
      tribunalColl ? tribunalColl.find({ createdBy: { $in: userMatches } }).toArray() : [],
      highcourtColl ? highcourtColl.find({ createdBy: { $in: userMatches } }).toArray() : [],
      foodColl ? foodColl.find({ createdBy: { $in: userMatches } }).toArray() : [],
      msmeColl ? msmeColl.find({ createdBy: { $in: userMatches } }).toArray() : [],
      gstRegColl ? gstRegColl.find({ createdBy: { $in: userMatches } }).toArray() : [],
      miscWorkColl ? miscWorkColl.find({ createdBy: { $in: userMatches } }).toArray() : []
    ]);

    const summary = {
      clients: [],
      litigation: [],
      invoices: [],
      work: [],
      gstReg: [],
      foodLic: [],
      msme: [],
      payments: []
    };
    const filingDataCache = {};

    for (const item of rawItems) {
      const transformed = {
        ...item.data,
        id: item._id ? item._id.toString() : item.id,
        _id: item._id ? item._id.toString() : item.id,
        createdAt: item.createdAt
      };

      if (item.name === 'client') summary.clients.push(transformed);
      else if (item.name === 'litigation') summary.litigation.push(transformed);
      else if (item.name === 'invoice') summary.invoices.push(transformed);
      else if (item.name === 'work') summary.work.push(transformed);
      else if (item.name === 'gstReg') summary.gstReg.push(transformed);
      else if (item.name === 'foodLic') summary.foodLic.push(transformed);
      else if (item.name === 'msme') summary.msme.push(transformed);
      else if (item.name === 'payment') summary.payments.push(transformed);
      else if (item.name.startsWith('app_data_')) {
        const key = item.name.replace('app_data_', '');
        filingDataCache[key] = item.data || {};
      }
    }

    // Merge dedicated collections into summary
    const normalizeDoc = (doc, defaultCategory) => ({
      ...doc,
      id: doc._id ? doc._id.toString() : doc.id,
      _id: doc._id ? doc._id.toString() : doc.id,
      category: doc.category || defaultCategory
    });

    const extraLitigation = [
      ...(rawNotices || []).map(d => normalizeDoc(d, 'Notice')),
      ...(rawAppeals || []).map(d => normalizeDoc(d, 'Appeal')),
      ...(rawTribunal || []).map(d => normalizeDoc(d, 'Tribunal')),
      ...(rawHighCourt || []).map(d => normalizeDoc(d, 'HighCourt'))
    ];

    const existingLitIds = new Set(summary.litigation.map(l => String(l.id || l._id)));
    for (const item of extraLitigation) {
      const id = String(item.id || item._id);
      if (!existingLitIds.has(id)) {
        existingLitIds.add(id);
        summary.litigation.push(item);
      }
    }

    // Merge misc collections
    if (rawFood && rawFood.length > 0) {
      const foodIds = new Set(summary.foodLic.map(f => String(f.id || f._id)));
      rawFood.forEach(f => {
        const id = String(f._id || f.id);
        if (!foodIds.has(id)) {
          foodIds.add(id);
          summary.foodLic.push({ ...f, id, _id: id });
        }
      });
    }

    if (rawMsme && rawMsme.length > 0) {
      const msmeIds = new Set(summary.msme.map(m => String(m.id || m._id)));
      rawMsme.forEach(m => {
        const id = String(m._id || m.id);
        if (!msmeIds.has(id)) {
          msmeIds.add(id);
          summary.msme.push({ ...m, id, _id: id });
        }
      });
    }

    if (rawGstReg && rawGstReg.length > 0) {
      const gstRegIds = new Set(summary.gstReg.map(g => String(g.id || g._id)));
      rawGstReg.forEach(g => {
        const id = String(g._id || g.id);
        if (!gstRegIds.has(id)) {
          gstRegIds.add(id);
          summary.gstReg.push({ ...g, id, _id: id });
        }
      });
    }

    if (rawMiscWork && rawMiscWork.length > 0) {
      const workIds = new Set(summary.work.map(w => String(w.id || w._id)));
      rawMiscWork.forEach(w => {
        const id = String(w._id || w.id);
        if (!workIds.has(id)) {
          workIds.add(id);
          summary.work.push({ ...w, id, _id: id });
        }
      });
    }

    // Mirror canonical keys in filingDataCache so all components get latest data seamlessly
    if (filingDataCache['monthly_filing_status'] && !filingDataCache['clientify_monthly_filing_v3']) {
      filingDataCache['clientify_monthly_filing_v3'] = filingDataCache['monthly_filing_status'];
    }
    if (filingDataCache['quarterly_filing_status'] && !filingDataCache['clientify_quarterly_filing_v3']) {
      filingDataCache['clientify_quarterly_filing_v3'] = filingDataCache['quarterly_filing_status'];
    }
    if (filingDataCache['composition_filing_status'] && !filingDataCache['clientify_composition_filing_v3']) {
      filingDataCache['clientify_composition_filing_v3'] = filingDataCache['composition_filing_status'];
    }
    if (filingDataCache['gstr4_filing_data'] && !filingDataCache['clientify_gstr4_filing_v1']) {
      filingDataCache['clientify_gstr4_filing_v1'] = filingDataCache['gstr4_filing_data'];
    }
    if (filingDataCache['gstr9_filing_data'] && !filingDataCache['clientify_gstr9_filing_data_v2']) {
      filingDataCache['clientify_gstr9_filing_data_v2'] = filingDataCache['gstr9_filing_data'];
    }
    if (filingDataCache['itr_filing_status_v1'] && !filingDataCache['clientify_itr_filing_data_v2']) {
      filingDataCache['clientify_itr_filing_data_v2'] = filingDataCache['itr_filing_status_v1'];
    }
    if (filingDataCache['tax_audit_filing_status_v1'] && !filingDataCache['clientify_audit_fin_data_v3']) {
      filingDataCache['clientify_audit_fin_data_v3'] = filingDataCache['tax_audit_filing_status_v1'];
    }
    if (filingDataCache['gstr9_watchlist'] && !filingDataCache['clientify_gstr9_watchlist_v2']) {
      filingDataCache['clientify_gstr9_watchlist_v2'] = filingDataCache['gstr9_watchlist'];
    }

    res.json({
      success: true,
      summary,
      filingDataCache,
      counts: {
        totalClients: summary.clients.length,
        totalInvoices: summary.invoices.length,
        totalPayments: summary.payments.length,
        totalLitigation: summary.litigation.length,
        totalGstReg: summary.gstReg.length,
        totalFoodLic: summary.foodLic.length,
        totalMsme: summary.msme.length,
        totalWork: summary.work.length
      }
    });
  } catch (err) {
    console.error('getDashboardData error:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
};
