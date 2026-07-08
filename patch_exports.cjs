const fs = require('fs');

function patchExport(file, headersStr, headersRepl, rowsStr, rowsRepl) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(headersStr, headersRepl);
  content = content.replace(rowsStr, rowsRepl);
  fs.writeFileSync(file, content);
}

const gstFile = 'pages/ClientHub/GSTPortfolio.tsx';
patchExport(gstFile, 
  '"Trade Name", "Legal Name", "Mobile", "Email", "GSTIN", "PAN"',
  '"Trade Name", "Legal Name", "Mobile", "Email", "Address", "GSTIN", "PAN"',
  'c?.tradeName, c?.legalName, c?.mobile, c?.email, \n      c?.gstProfile?.gstin',
  'c?.tradeName, c?.legalName, c?.mobile, c?.email, c?.address,\n      c?.gstProfile?.gstin'
);

const itFile = 'pages/ClientHub/ITPortfolio.tsx';
patchExport(itFile,
  '"Legal Name", "Trade Name", "Mobile", "Email", "PAN",',
  '"Legal Name", "Trade Name", "Mobile", "Email", "Address", "PAN",',
  'c?.legalName, c?.tradeName, c?.mobile, c?.email,\n      c?.itProfile?.pan',
  'c?.legalName, c?.tradeName, c?.mobile, c?.email, c?.address,\n      c?.itProfile?.pan'
);

console.log("Patched exports");
