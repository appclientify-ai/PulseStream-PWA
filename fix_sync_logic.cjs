const fs = require('fs');

function patch(file) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/socketService\.on\('sync_data', loadData\);/g, "window.addEventListener('clientify_db_change', loadData);");
  c = c.replace(/socketService\.off\('sync_data', loadData\);/g, "window.removeEventListener('clientify_db_change', loadData);");
  fs.writeFileSync(file, c);
}

patch('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx');
patch('pages/Compliance/GSTReturn/filinglogic/CompositionFilingLogic.tsx');
