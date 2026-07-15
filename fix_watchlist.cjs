const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/ITAudit/TAXAuditlogic.tsx', 'utf8');

c = c.replace(/const next = \{ \.\.\.prev, \[selectedYear\]: \[\.\.\.current, clientId\] \};\s*api\.saveAppData\(STORAGE_KEY_WATCHLIST, next\)\.catch/g,
  `const next = { ...prev, [selectedYear]: [...current, clientId] };\n      api.patchAppData(STORAGE_KEY_WATCHLIST, { [\`data.\${selectedYear}\`]: next[selectedYear] }).catch`
);

c = c.replace(/next\[year\] = prev\[year\]\.filter\(id => id !== clientId\);\s*\}\);\s*api\.saveAppData\(STORAGE_KEY_WATCHLIST, next\)\.catch/g,
  `next[year] = prev[year].filter(id => id !== clientId);\n      });\n      api.patchAppData(STORAGE_KEY_WATCHLIST, { "data": next }).catch`
);

fs.writeFileSync('pages/Compliance/ITAudit/TAXAuditlogic.tsx', c);
