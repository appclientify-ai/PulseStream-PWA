const fs = require('fs');
const file = 'pages/Compliance/ITAudit/ITRReturn.tsx';
let content = fs.readFileSync(file, 'utf8');

const newText = "`*IT Return Profile*\\nName: ${selectedClient.legalName || 'N/A'}\\nMobile: ${selectedClient.mobile || 'N/A'}\\nEmail: ${selectedClient.email || 'N/A'}\\n\\n*IT Details*\\nPAN: ${selectedClient.itProfile?.pan || 'N/A'}\\nFather Name: ${selectedClient.itProfile?.fatherName || 'N/A'}\\nDOB: ${selectedClient.itProfile?.dob || 'N/A'}\\nAddress: ${selectedClient.itProfile?.address || 'N/A'}`";

content = content.replace(
    /\`\*IT Return Profile\*\\[n]Name: \$\{selectedClient\.legalName\}\\[n]PAN: \$\{selectedClient\.itProfile\?\.pan\}\\[n]Mobile: \$\{selectedClient\.mobile\}\`/,
    newText
);

fs.writeFileSync(file, content);
console.log('Patched ITR WhatsApp');
