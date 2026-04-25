const fs = require('fs');
['pages/ClientHub/GstMasterPortfolio.tsx', 'pages/ClientHub/GSTPortfolio.tsx'].forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/setClients\(data\.filter/g, 'setClients((data || []).filter');
  fs.writeFileSync(f, content);
});
console.log("Fixed setClients");
