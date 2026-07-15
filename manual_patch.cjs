const fs = require('fs');

function replaceFile(file, pattern, replacement) {
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8');
    let init = c;
    c = c.replace(pattern, replacement);
    if (init !== c) {
      fs.writeFileSync(file, c);
      console.log('Replaced in', file);
    }
  }
}

replaceFile('pages/Compliance/ITAudit/ITRReturnlogic.tsx', 
  /yearData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[selectedAY\]: yearData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
  `yearData[clientId] = clientData;\n      const next = { ...prev, [selectedAY]: yearData };\n      api.patchAppData($1, { [\`data.\${selectedAY}.\${clientId}\`]: clientData }).catch`
);

replaceFile('pages/Compliance/ITAudit/ITRReturnlogic.tsx', 
  /const next = \{ \.\.\.dueDates, \[selectedAY\]: val \};\s*setDueDates\(next\);\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
  `const next = { ...dueDates, [selectedAY]: val };\n    setDueDates(next);\n    api.patchAppData($1, { [\`data.\${selectedAY}\`]: val }).catch`
);

replaceFile('pages/Compliance/ITAudit/TAXAuditlogic.tsx', 
  /yearData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[selectedAY\]: yearData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
  `yearData[clientId] = clientData;\n      const next = { ...prev, [selectedAY]: yearData };\n      api.patchAppData($1, { [\`data.\${selectedAY}.\${clientId}\`]: clientData }).catch`
);

replaceFile('pages/Compliance/ITAudit/TAXAuditlogic.tsx', 
  /const next = \{ \.\.\.dueDates, \[selectedAY\]: val \};\s*setDueDates\(next\);\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
  `const next = { ...dueDates, [selectedAY]: val };\n    setDueDates(next);\n    api.patchAppData($1, { [\`data.\${selectedAY}\`]: val }).catch`
);

replaceFile('pages/Compliance/ITAudit/Balancesheetlogic.tsx', 
  /yearData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[selectedAY\]: yearData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
  `yearData[clientId] = clientData;\n      const next = { ...prev, [selectedAY]: yearData };\n      api.patchAppData($1, { [\`data.\${selectedAY}.\${clientId}\`]: clientData }).catch`
);

replaceFile('pages/Compliance/ITAudit/Balancesheetlogic.tsx', 
  /const next = \{ \.\.\.dueDates, \[selectedAY\]: val \};\s*setDueDates\(next\);\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
  `const next = { ...dueDates, [selectedAY]: val };\n    setDueDates(next);\n    api.patchAppData($1, { [\`data.\${selectedAY}\`]: val }).catch`
);


replaceFile('pages/Compliance/AnnualReturns/GSTR9_9Clogic.tsx', 
  /periodData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[periodKey\]: periodData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
  `periodData[clientId] = clientData;\n      const next = { ...prev, [periodKey]: periodData };\n      api.patchAppData($1, { [\`data.\${periodKey}.\${clientId}\`]: clientData }).catch`
);

replaceFile('pages/Compliance/AnnualReturns/GSTR4logic.tsx', 
  /periodData\[clientId\] = clientData;\s*const next = \{ \.\.\.prev, \[periodKey\]: periodData \};\s*api\.saveAppData\(([^,]+), next\)\.catch/g,
  `periodData[clientId] = clientData;\n      const next = { ...prev, [periodKey]: periodData };\n      api.patchAppData($1, { [\`data.\${periodKey}.\${clientId}\`]: clientData }).catch`
);


replaceFile('pages/Administration/DueDateSetting.tsx', 
  /await api\.saveAppData\(([^,]+), dates\);/g,
  `await api.patchAppData($1, Object.fromEntries(Object.entries(dates).map(([k,v]) => [\`data.\${k}\`, v])));`
);

