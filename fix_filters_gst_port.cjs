const fs = require('fs');
let file = 'pages/ClientHub/GSTPortfolio.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/total: clients\.length,/g, 'total: (clients || []).length,');
content = content.replace(/clients\.filter/g, '(clients || []).filter');

fs.writeFileSync(file, content);

console.log("Fixed GSTPortfolio filters");
