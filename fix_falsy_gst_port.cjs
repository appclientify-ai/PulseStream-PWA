const fs = require('fs');
let file = 'pages/ClientHub/GSTPortfolio.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/clients\.filter\(c => c\.status/g, 'clients.filter(c => c?.status');
content = content.replace(/\(clients \|\| \[\]\)\.filter\(c => c\.status/g, '(clients || []).filter(c => c?.status');
content = content.replace(/clients\.map\(c => /g, '(clients || []).filter(Boolean).map(c => ');

content = content.replace(/setClients\(\(data \|\| \[\]\)\.filter\(c => !!c\.gstProfile\)\)/g, "setClients((data || []).filter(c => c && c.gstProfile))");

fs.writeFileSync(file, content);

console.log("Fixed falsy c in GSTPortfolio");
