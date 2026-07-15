const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/GSTReturn/filinglogic/CompositionFilingLogic.tsx', 'utf8');

c = c.replace(/clientData\.cmp08 = !clientData\.cmp08;\s*periodData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[periodKey\]: periodData \};\s*api\.saveAppData\(([^,]+), next\)\.catch\((.*?)\);/g,
  `const newVal = !clientData.cmp08;\n      clientData.cmp08 = newVal;\n      periodData[clientId] = clientData;\n      const next = { ...prev, [periodKey]: periodData };\n      api.patchAppData($1, { [\`data.\${periodKey}.\${clientId}.cmp08\`]: newVal }).catch($2);`
);

fs.writeFileSync('pages/Compliance/GSTReturn/filinglogic/CompositionFilingLogic.tsx', c);
