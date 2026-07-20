const fs = require('fs');
let c = fs.readFileSync('services/api.ts', 'utf8');

c = c.replace(/const res = await fetch\(url, \{ method: 'GET', headers \}\);/g, 
"const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });");

fs.writeFileSync('services/api.ts', c);
console.log("Patched API caching");
