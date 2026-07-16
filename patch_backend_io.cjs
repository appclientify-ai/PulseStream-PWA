const fs = require('fs');
let c = fs.readFileSync('backend/src/controllers/items.controller.js', 'utf8');

const targetStr = `    if (result) {\n      // Emit an update event?\n    }`;
const newStr = `    const io = req.app.get('io');\n    if (io && result) {\n      io.emit('db_item_change', { type: 'update', data: result, id: result._id, timestamp: new Date() });\n    }`;

c = c.replace(targetStr, newStr);

// Or if targetStr doesn't exist, replace the return
c = c.replace(/    res\.json\(result\);\n  \} catch \(error\) \{/g,
  `    const io = req.app.get('io');\n    if (io && result) {\n      io.emit('db_item_change', { type: 'update', data: result, id: result._id, timestamp: new Date() });\n    }\n    res.json(result);\n  } catch (error) {`
);

fs.writeFileSync('backend/src/controllers/items.controller.js', c);
