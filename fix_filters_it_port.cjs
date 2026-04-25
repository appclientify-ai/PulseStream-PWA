const fs = require('fs');

['pages/ClientHub/ItMasterPortfolio.tsx', 'pages/ClientHub/ITPortfolio.tsx'].forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/setClients\(data\.filter/g, 'setClients((data || []).filter');
  content = content.replace(/total: clients\.length,/g, 'total: (clients || []).length,');
  content = content.replace(/clients\.filter/g, '(clients || []).filter');

  let listMatch = content.match(/let list = clients;/);
  if (listMatch) {
     content = content.replace(/let list = clients;/g, 'let list = clients || [];');
  }

  // Also safeString in ItMasterPortfolio if it doesn't have it
  content = content.replace(/String\(c\.mobile \|\| ''\)\.includes\(s\)/g, "String(c.mobile || '').toLowerCase().includes(s)");

  fs.writeFileSync(file, content);
});

console.log("Fixed ITPortfolio filters");
