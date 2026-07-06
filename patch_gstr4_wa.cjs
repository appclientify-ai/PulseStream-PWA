const fs = require('fs');
const file = 'pages/Compliance/AnnualReturns/GSTR4.tsx';
let content = fs.readFileSync(file, 'utf8');

const newText = "`*Entity Profile*\\nTrade Name: ${selectedClient.tradeName || 'N/A'}\\nLegal Name: ${selectedClient.legalName || 'N/A'}\\nMobile: ${selectedClient.mobile || 'N/A'}\\nEmail: ${selectedClient.email || 'N/A'}\\n\\n*GST Details*\\nGSTIN: ${selectedClient.gstProfile?.gstin || 'N/A'}\\nStatus: ${selectedClient.gstProfile?.gstStatus || 'N/A'}\\nReg Type: ${selectedClient.gstProfile?.regType || 'N/A'}\\nFiling: ${selectedClient.gstProfile?.filingFreq || 'N/A'}\\nReg Date: ${selectedClient.gstProfile?.regDate || 'N/A'}\\nJurisdiction: ${selectedClient.gstProfile?.jurisdictionType || 'N/A'}\\nSector/Range: ${selectedClient.gstProfile?.sector || selectedClient.gstProfile?.range || 'N/A'}`";

content = content.replace(
    /\`\*Entity Profile\*\\[n]Name: \$\{selectedClient\.legalName\}\\[n]Trade: \$\{selectedClient\.tradeName\}\\[n]GSTIN: \$\{selectedClient\.gstProfile\?\.gstin\}\\[n]Mobile: \$\{selectedClient\.mobile\}\`/,
    newText
);

fs.writeFileSync(file, content);
console.log('Patched GSTR4 WhatsApp');
