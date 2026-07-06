const fs = require('fs');
const file = 'pages/ClientHub/GstMasterPortfolio.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldText = "`*Client Details*\\nTrade Name: ${selectedClient!.tradeName || ''}\\nLegal Name: ${selectedClient!.legalName || ''}\\nMobile: ${selectedClient!.mobile || ''}\\nEmail: ${selectedClient!.email || ''}\\n\\n*GST Details*\\nGSTIN: ${selectedClient!.gstProfile?.gstin || ''}\\nUser ID: ${selectedClient!.gstProfile?.username || ''}\\nPassword: ${selectedClient!.gstProfile?.password || ''}\\n\\n*IT Details*\\nPAN: ${selectedClient!.itProfile?.pan || ''}\\nIT User ID: ${selectedClient!.itProfile?.username || ''}\\nIT Password: ${selectedClient!.itProfile?.password || ''}`";

const newText = "`*Client Details*\\nTrade Name: ${selectedClient!.tradeName || 'N/A'}\\nLegal Name: ${selectedClient!.legalName || 'N/A'}\\nMobile: ${selectedClient!.mobile || 'N/A'}\\nEmail: ${selectedClient!.email || 'N/A'}\\n\\n*GST Details*\\nGSTIN: ${selectedClient!.gstProfile?.gstin || 'N/A'}\\nStatus: ${selectedClient!.gstProfile?.gstStatus || 'N/A'}\\nReg Type: ${selectedClient!.gstProfile?.regType || 'N/A'}\\nFiling: ${selectedClient!.gstProfile?.filingFreq || 'N/A'}\\nReg Date: ${selectedClient!.gstProfile?.regDate || 'N/A'}\\nJurisdiction: ${selectedClient!.gstProfile?.jurisdictionType || 'N/A'}\\nSector/Range: ${selectedClient!.gstProfile?.sector || selectedClient!.gstProfile?.range || 'N/A'}\\n\\n*Credentials*\\nGST User ID: ${selectedClient!.gstProfile?.username || 'N/A'}\\nGST Password: ${selectedClient!.gstProfile?.password || 'N/A'}\\n\\n*IT Details*\\nPAN: ${selectedClient!.itProfile?.pan || 'N/A'}\\nIT User ID: ${selectedClient!.itProfile?.username || 'N/A'}\\nIT Password: ${selectedClient!.itProfile?.password || 'N/A'}`";

if (content.includes(oldText)) {
    content = content.replace(oldText, newText);
    fs.writeFileSync(file, content);
    console.log('Patched GstMasterPortfolio');
} else {
    console.log('Could not find old text');
}
