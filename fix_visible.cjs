const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', 'utf8');

c = c.replace(/export const isClientVisibleInPeriod = \(client: Client, selectedYear: string, selectedMonth: string\) => \{\s*if \(!client\.gstProfile\) return false;/g,
  `export const isClientVisibleInPeriod = (client: Client, selectedYear: string, selectedMonth: string) => {\n  if (!client || !client.gstProfile) return false;`
);

c = c.replace(/export const isClientVisibleInFY = \(client: Client, fy: string\) => \{\s*if \(!client\.gstProfile\) return false;/g,
  `export const isClientVisibleInFY = (client: Client, fy: string) => {\n  if (!client || !client.gstProfile) return false;`
);

fs.writeFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', c);
