const fs = require('fs');
const file = 'pages/Administration/invoice/addinvoice.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "clientTradeName: clientTradeName,",
  "clientTradeName: clientTradeName,\n        clientGstin: clientGstin,"
);

content = content.replace(
  "setClientTradeName(editingInvoice.clientTradeName || '');",
  "setClientTradeName(editingInvoice.clientTradeName || '');\n        setClientGstin(editingInvoice.clientGstin || '');"
);

fs.writeFileSync(file, content);
console.log("Patched addinvoice.tsx");
