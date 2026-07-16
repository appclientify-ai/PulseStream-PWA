const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', 'utf8');

c = c.replace(/api\.patchAppData\(storageKey, \{ \[\`data\.\$\{periodKey\}\.\$\{clientId\}\.\$\{type\}\`\]: newVal \}\)\.catch\(err => console\.error\('Failed to save filing data', err\)\);/g,
  `api.patchAppData(storageKey, { [\`data.\${periodKey}.\${clientId}.\${type}\`]: newVal }).then(() => socketService.emit('data_updated')).catch(err => console.error('Failed to save filing data', err));`
);

c = c.replace(/api\.patchAppData\(storageKeyDates, \{ \[\`data\.\$\{key\}\`\]: val \}\)\.catch\(err => console\.error\('Failed to save due dates', err\)\);/g,
  `api.patchAppData(storageKeyDates, { [\`data.\${key}\`]: val }).then(() => socketService.emit('data_updated')).catch(err => console.error('Failed to save due dates', err));`
);

fs.writeFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', c);
