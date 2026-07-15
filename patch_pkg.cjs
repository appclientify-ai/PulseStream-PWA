const fs = require('fs');
let content = fs.readFileSync('package.json', 'utf8');
content = content.replace('"dev": "node backend/src/server.js"', '"dev": "vite"');
fs.writeFileSync('package.json', content);
