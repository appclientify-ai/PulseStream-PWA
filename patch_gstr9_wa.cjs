const fs = require('fs');
const file = 'pages/Compliance/AnnualReturns/GSTR9_9C.tsx';
let content = fs.readFileSync(file, 'utf8');

const newText = "`*Audit Dossier*\\nTrade Name: ${selectedClient.tradeName || 'N/A'}\\nLegal Name: ${selectedClient.legalName || 'N/A'}\\nMobile: ${selectedClient.mobile || 'N/A'}\\nEmail: ${selectedClient.email || 'N/A'}\\n\\n*GST Details*\\nGSTIN: ${selectedClient.gstProfile?.gstin || 'N/A'}\\nStatus: ${selectedClient.gstProfile?.gstStatus || 'N/A'}\\nReg Type: ${selectedClient.gstProfile?.regType || 'N/A'}\\nFiling: ${selectedClient.gstProfile?.filingFreq || 'N/A'}\\nReg Date: ${selectedClient.gstProfile?.regDate || 'N/A'}\\nJurisdiction: ${selectedClient.gstProfile?.jurisdictionType || 'N/A'}\\nSector/Range: ${selectedClient.gstProfile?.sector || selectedClient.gstProfile?.range || 'N/A'}\\n9C Applies: ${is9CApplicable(selectedClient.id) ? 'YES' : 'NO'}`";

content = content.replace(
    /\`\*Audit Dossier\*\\[n]Entity: \$\{selectedClient\.legalName\}\\[n]GSTIN: \$\{selectedClient\.gstProfile\?\.gstin\}\\[n]9C Applies: \$\{is9CApplicable\(selectedClient\.id\) \? 'YES' : 'NO'\}\`/,
    newText
);

fs.writeFileSync(file, content);
console.log('Patched GSTR9 WhatsApp');
