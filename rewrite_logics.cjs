const fs = require('fs');

function patchLogicFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Monthly, Quarterly, Composition use similar toggleStatus
  if (content.includes("type: 'r1' | 'r3b' | 'cmp08'") || content.includes("type: 'cmp08'") || content.includes("type: 'filed'") || content.includes("type: 'gstr9' | 'gstr9c'")) {
     content = content.replace(
       /\(clientData as any\)\[type\] = !\(clientData as any\)\[type\];\s*periodData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[periodKey\]: periodData \};\s*api\.saveAppData\(([^,]+), next\)\.catch\((.*?)\);/g,
       `const newVal = !(clientData as any)[type];\n      (clientData as any)[type] = newVal;\n      periodData[clientId] = clientData;\n      const next = { ...prev, [periodKey]: periodData };\n      api.patchAppData($1, { [\`data.\${periodKey}.\${clientId}.\${type}\`]: newVal }).catch($2);`
     );
     changed = true;
  }
  
  // Tax Audit has multiple: updateStatus, updateConfig, toggleWatchlist
  if (content.includes('toggleWatchlist')) {
     content = content.replace(
       /const newVal = !prev\[clientId\];\s*const next = \{ \.\.\.prev, \[clientId\]: newVal \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
       `const newVal = !prev[clientId];\n      const next = { ...prev, [clientId]: newVal };\n      api.patchAppData($1, { [\`data.\${clientId}\`]: newVal }).catch`
     );
     changed = true;
  }
  
  // IT Return updateFiledStatus
  if (content.includes('updateFiledStatus')) {
     content = content.replace(
       /const newVal = !clientData\.filed;\s*clientData\.filed = newVal;\s*periodData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[periodKey\]: periodData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
       `const newVal = !clientData.filed;\n      clientData.filed = newVal;\n      periodData[clientId] = clientData;\n      const next = { ...prev, [periodKey]: periodData };\n      api.patchAppData($1, { [\`data.\${periodKey}.\${clientId}.filed\`]: newVal }).catch`
     );
     changed = true;
  }

  // Common due date patch
  if (content.includes('updateDueDate = (val: string) => {')) {
     content = content.replace(
       /const next = \{ \.\.\.dueDates, \[key\]: val \};\s*setDueDates\(next\);\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
       `const next = { ...dueDates, [key]: val };\n    setDueDates(next);\n    api.patchAppData($1, { [\`data.\${key}\`]: val }).catch`
     );
     changed = true;
  }

  // Any other saveAppData in setAllData or specific functions?
  // gstr9 updateConfig
  if (content.includes('updateConfig = (clientId')) {
     content = content.replace(
       /const next = \{ \.\.\.prev, \[clientId\]: newConfig \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
       `const next = { ...prev, [clientId]: newConfig };\n      api.patchAppData($1, { [\`data.\${clientId}\`]: newConfig }).catch`
     );
     changed = true;
  }
  
  if (content.includes('updateStatus = (clientId')) {
     content = content.replace(
       /clientData\.status = newStatus;\s*periodData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[periodKey\]: periodData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
       `clientData.status = newStatus;\n      periodData[clientId] = clientData;\n      const next = { ...prev, [periodKey]: periodData };\n      api.patchAppData($1, { [\`data.\${periodKey}.\${clientId}.status\`]: newStatus }).catch`
     );
     changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Patched logic:', file);
  }
}

const logics = [
  'pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx',
  'pages/Compliance/GSTReturn/filinglogic/QuarterlyFilingLogic.tsx',
  'pages/Compliance/GSTReturn/filinglogic/CompositionFilingLogic.tsx',
  'pages/Compliance/AnnualReturns/GSTR4logic.tsx',
  'pages/Compliance/AnnualReturns/GSTR9_9Clogic.tsx',
  'pages/Compliance/ITAudit/ITRReturnlogic.tsx',
  'pages/Compliance/ITAudit/TAXAuditlogic.tsx',
  'pages/Compliance/ITAudit/Balancesheetlogic.tsx'
];

logics.forEach(patchLogicFile);
