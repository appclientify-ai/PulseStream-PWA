const fs = require('fs');

function replaceAll(file) {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  let init = c;

  // Quarterly / Composition
  c = c.replace(/clientData\[type\] = !clientData\[type\];\s*periodData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[periodKey\]: periodData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
    `const newVal = !clientData[type];\n      clientData[type] = newVal;\n      periodData[clientId] = clientData;\n      const next = { ...prev, [periodKey]: periodData };\n      api.patchAppData($1, { [\`data.\${periodKey}.\${clientId}.\${type}\`]: newVal }).catch`
  );

  c = c.replace(/clientData\[type\] = !clientData\[type\];\s*periodData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[periodKey\]: periodData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
    `const newVal = !clientData[type];\n      clientData[type] = newVal;\n      periodData[clientId] = clientData;\n      const next = { ...prev, [periodKey]: periodData };\n      api.patchAppData($1, { [\`data.\${periodKey}.\${clientId}.\${type}\`]: newVal }).catch`
  );

  // Common due date patch again
  c = c.replace(/const next = \{ \.\.\.dueDates, \[key\]: val \};\s*setDueDates\(next\);\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
    `const next = { ...dueDates, [key]: val };\n    setDueDates(next);\n    api.patchAppData($1, { [\`data.\${key}\`]: val }).catch`
  );
  
  c = c.replace(/const next = \{ \.\.\.dueDates, \[selectedYear\]: val \};\s*setDueDates\(next\);\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
    `const next = { ...dueDates, [selectedYear]: val };\n    setDueDates(next);\n    api.patchAppData($1, { [\`data.\${selectedYear}\`]: val }).catch`
  );
  c = c.replace(/const next = \{ \.\.\.dueDates, \[periodKey\]: val \};\s*setDueDates\(next\);\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
    `const next = { ...dueDates, [periodKey]: val };\n    setDueDates(next);\n    api.patchAppData($1, { [\`data.\${periodKey}\`]: val }).catch`
  );

  // GSTR9 Config
  c = c.replace(/const newConfig = \{ \.\.\.\(prev\[clientId\] \|\| \{\}\), \[field\]: val \};\s*const next = \{ \.\.\.prev, \[clientId\]: newConfig \};\s*api\.saveAppData\(STORAGE_KEY_CONFIG, newConfig\)\.catch\(console\.error\);/g,
    `const newConfig = { ...(prev[clientId] || {}), [field]: val };\n      const next = { ...prev, [clientId]: newConfig };\n      api.patchAppData(STORAGE_KEY_CONFIG, { [\`data.\${clientId}.\${field}\`]: val }).catch(console.error);`
  );

  // GSTR9 Watchlist / TAXAudit watchlist
  c = c.replace(/const newVal = !prev\[clientId\];\s*const next = \{ \.\.\.prev, \[clientId\]: newVal \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
    `const newVal = !prev[clientId];\n      const next = { ...prev, [clientId]: newVal };\n      api.patchAppData($1, { [\`data.\${clientId}\`]: newVal }).catch`
  );

  // GSTR9 Data / TAXAudit data
  c = c.replace(/yearData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[selectedYear\]: yearData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
    `yearData[clientId] = clientData;\n      const next = { ...prev, [selectedYear]: yearData };\n      api.patchAppData($1, { [\`data.\${selectedYear}.\${clientId}\`]: clientData }).catch`
  );

  // GSTR4
  c = c.replace(/const newVal = !clientData\[type\];\s*clientData\[type\] = newVal;\s*periodData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[selectedYear\]: periodData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
    `const newVal = !clientData[type];\n      clientData[type] = newVal;\n      periodData[clientId] = clientData;\n      const next = { ...prev, [selectedYear]: periodData };\n      api.patchAppData($1, { [\`data.\${selectedYear}.\${clientId}.\${type}\`]: newVal }).catch`
  );
  
  if (init !== c) {
    fs.writeFileSync(file, c);
    console.log('Patched', file);
  }
}

const files = [
  'pages/Compliance/GSTReturn/filinglogic/QuarterlyFilingLogic.tsx',
  'pages/Compliance/GSTReturn/filinglogic/CompositionFilingLogic.tsx',
  'pages/Compliance/AnnualReturns/GSTR4logic.tsx',
  'pages/Compliance/AnnualReturns/GSTR9_9Clogic.tsx',
  'pages/Compliance/ITAudit/TAXAuditlogic.tsx',
  'pages/Compliance/ITAudit/Balancesheetlogic.tsx'
];

files.forEach(replaceAll);
