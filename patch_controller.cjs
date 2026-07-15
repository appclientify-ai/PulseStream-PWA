const fs = require('fs');

let content = fs.readFileSync('backend/src/controllers/items.controller.js', 'utf8');

const patchFunc = `
export const patchAppData = async (req, res) => {
  const { key } = req.params;
  const { updates } = req.body; // e.g. { "data.2023_April.client1.r1": true }
  
  try {
    const items = getCollection('items');
    
    // Check if the item exists
    const existing = await items.findOne({ name: 'app_data_' + key, createdBy: req.user._id });
    
    let result;
    if (existing) {
      result = await items.findOneAndUpdate(
        { _id: existing._id },
        { 
          $set: { ...updates, updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );
    } else {
      // Upsert
      result = await items.findOneAndUpdate(
        { name: 'app_data_' + key, createdBy: req.user._id },
        { 
          $set: { ...updates, updatedAt: new Date() },
          $setOnInsert: { name: 'app_data_' + key, createdBy: req.user._id, creatorName: req.user.username, createdAt: new Date() }
        },
        { returnDocument: 'after', upsert: true }
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'update', data: result, id: result._id, timestamp: new Date() });
    }
    
    res.json(result);
  } catch (err) {
    console.error('Patch AppData Error:', err);
    res.status(500).json({ error: 'Failed to patch app data' });
  }
};
`;

if (!content.includes('patchAppData')) {
  content += patchFunc;
  fs.writeFileSync('backend/src/controllers/items.controller.js', content);
}
