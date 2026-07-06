const fs = require('fs');

const oldText = "`Trade Name: ${selectedClient.tradeName || ''}\\nLegal Name: ${selectedClient.legalName || ''}\\nGSTIN: ${selectedClient.gstProfile?.gstin || ''}\\nUser ID: ${selectedClient.gstProfile?.username || ''}\\nPassword: ${selectedClient.gstProfile?.password || ''}`";
const newText = "`*Entity Profile*\\nTrade Name: ${selectedClient.tradeName || 'N/A'}\\nLegal Name: ${selectedClient.legalName || 'N/A'}\\nMobile: ${selectedClient.mobile || 'N/A'}\\nEmail: ${selectedClient.email || 'N/A'}\\n\\n*GST Details*\\nGSTIN: ${selectedClient.gstProfile?.gstin || 'N/A'}\\nStatus: ${selectedClient.gstProfile?.gstStatus || 'N/A'}\\nReg Type: ${selectedClient.gstProfile?.regType || 'N/A'}\\nFiling: ${selectedClient.gstProfile?.filingFreq || 'N/A'}\\nReg Date: ${selectedClient.gstProfile?.regDate || 'N/A'}\\nJurisdiction: ${selectedClient.gstProfile?.jurisdictionType || 'N/A'}\\nSector/Range: ${selectedClient.gstProfile?.sector || selectedClient.gstProfile?.range || 'N/A'}\\n\\n*Credentials*\\nGST User ID: ${selectedClient.gstProfile?.username || 'N/A'}\\nGST Password: ${selectedClient.gstProfile?.password || 'N/A'}`";

const files = [
    'pages/Compliance/GSTReturn/MonthlyFiling.tsx',
    'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
    'pages/Compliance/GSTReturn/CompositionFiling.tsx'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(oldText)) {
        content = content.replace(oldText, newText);
        fs.writeFileSync(file, content);
        console.log('Patched', file);
    }
}
