const fs = require('fs');
let c = fs.readFileSync('backend/src/controllers/items.controller.js', 'utf8');

const regex = /const io = req\.app\.get\('io'\);/g;
const replace = `
    // Unwrap the result if it's nested
    if (result && result.value) {
      result = result.value;
    }
    const io = req.app.get('io');`;

c = c.replace(regex, replace);

fs.writeFileSync('backend/src/controllers/items.controller.js', c);
