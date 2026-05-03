const fs = require('fs');
let file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/clients\.filter\(c => /g, '(clients || []).filter(c => c && ');
fs.writeFileSync(file, content);
console.log("Fixed dashboard");
