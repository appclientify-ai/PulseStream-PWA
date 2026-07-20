const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', 'utf8');

c = c.replace(/export const periodToDate = \(fy: string, monthName: string\) => \{/g,
  `export const periodToDate = (fy: string, monthName: string) => {\n  if (!fy) return new Date();`
);

fs.writeFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', c);
