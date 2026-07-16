const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/GSTReturn/filinglogic/CompositionFilingLogic.tsx', 'utf8');

c = c.replace(/api\.patchAppData\(STORAGE_KEY, \{ \[\`data\.\$\{periodKey\}\.\$\{clientId\}\.cmp08\`\]: newVal \}\)\.catch\(err => console\.error\('Failed to save composition data', err\)\);/g,
  `api.patchAppData(STORAGE_KEY, { [\`data.\${periodKey}.\${clientId}.cmp08\`]: newVal }).then(() => socketService.emit('data_updated')).catch(err => console.error('Failed to save composition data', err));`
);

c = c.replace(/api\.patchAppData\(STORAGE_KEY_DATES, \{ \[\`data\.\$\{periodKey\}\`\]: val \}\)\.catch\(err => console\.error\('Failed to save composition due dates', err\)\);/g,
  `api.patchAppData(STORAGE_KEY_DATES, { [\`data.\${periodKey}\`]: val }).then(() => socketService.emit('data_updated')).catch(err => console.error('Failed to save composition due dates', err));`
);

fs.writeFileSync('pages/Compliance/GSTReturn/filinglogic/CompositionFilingLogic.tsx', c);
