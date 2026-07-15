const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/AnnualReturns/GSTR9_9Clogic.tsx', 'utf8');

c = c.replace(/yearData\[clientId\] = clientData;\s*const next = \{ \.\.\.filingData, \[selectedYear\]: yearData \};\s*updateFilingData\(next\);/g,
  `yearData[clientId] = clientData;\n    const next = { ...filingData, [selectedYear]: yearData };\n    setFilingData(next);\n    api.patchAppData(STORAGE_KEY_DATA, { [\`data.\${selectedYear}.\${clientId}\`]: clientData }).catch(console.error);`
);

c = c.replace(/const updateFilingData = \(newData: Record<string, Record<string, GSTR9FilingStatus>>\) => \{\s*setFilingData\(newData\);\s*api\.saveAppData\(STORAGE_KEY_DATA, newData\)\.catch\(console\.error\);\s*\};\s*const updateConfig/g,
  `const updateFilingData = (newData: Record<string, Record<string, GSTR9FilingStatus>>) => {\n    setFilingData(newData);\n  };\n\n  const updateConfig`
);

c = c.replace(/const newConfig = \{ \.\.\.config, \[clientId\]: \{ gstr9cApplicable: isApplicable \} \};\s*updateConfig\(newConfig\);/g,
  `const newConfig = { ...config, [clientId]: { gstr9cApplicable: isApplicable } };\n    setConfig(newConfig);\n    api.patchAppData(STORAGE_KEY_CONFIG, { [\`data.\${clientId}.gstr9cApplicable\`]: isApplicable }).catch(console.error);`
);

c = c.replace(/const updateConfig = \(newConfig: Record<string, \{ gstr9cApplicable: boolean \}\>\) => \{\s*setConfig\(newConfig\);\s*api\.saveAppData\(STORAGE_KEY_CONFIG, newConfig\)\.catch\(console\.error\);\s*\};/g,
  `const updateConfig = (newConfig: Record<string, { gstr9cApplicable: boolean }>) => {\n    setConfig(newConfig);\n  };`
);


c = c.replace(/const next = \{ \.\.\.prev, \[selectedYear\]: \[\.\.\.current, clientId\] \};\s*api\.saveAppData\(STORAGE_KEY_WATCHLIST, next\)\.catch\(console\.error\);/g,
  `const next = { ...prev, [selectedYear]: [...current, clientId] };\n      api.patchAppData(STORAGE_KEY_WATCHLIST, { [\`data.\${selectedYear}\`]: next[selectedYear] }).catch(console.error);`
);

c = c.replace(/next\[year\] = prev\[year\]\.filter\(id => id !== clientId\);\s*\}\);\s*api\.saveAppData\(STORAGE_KEY_WATCHLIST, next\)\.catch\(console\.error\);/g,
  `next[year] = prev[year].filter(id => id !== clientId);\n      });\n      api.patchAppData(STORAGE_KEY_WATCHLIST, { "data": next }).catch(console.error);`
);

fs.writeFileSync('pages/Compliance/AnnualReturns/GSTR9_9Clogic.tsx', c);
