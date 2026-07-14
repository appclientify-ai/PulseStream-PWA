const fs = require('fs');
let content = fs.readFileSync('backend/src/controllers/items.controller.js', 'utf8');

const updatedContent = content.replace(/res\.status\(201\)\.json\(\{ \.\.\.newItem\, _id\: result\.insertedId \}\)\;/g, `
    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'insert', data: { ...newItem, _id: result.insertedId }, id: result.insertedId, timestamp: new Date() });
    }
    res.status(201).json({ ...newItem, _id: result.insertedId });
`)
.replace(/res\.json\(result\)\;/g, `
    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'update', data: result, id: id, timestamp: new Date() });
    }
    res.json(result);
`)
.replace(/res\.json\(\{ message\: 'Record permanently removed from vault' \}\)\;/g, `
    const io = req.app.get('io');
    if (io) {
      io.emit('db_item_change', { type: 'delete', id: id, timestamp: new Date() });
    }
    res.json({ message: 'Record permanently removed from vault' });
`);

fs.writeFileSync('backend/src/controllers/items.controller.js', updatedContent);
console.log('Patched items controller with manual socket emissions');
