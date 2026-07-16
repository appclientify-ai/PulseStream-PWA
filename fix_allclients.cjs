const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/GSTReturn/MonthlyFiling.tsx', 'utf8');

c = c.replace(/const sameGroup = allClientsBase\.filter\(c =>/g,
  `const sameGroup = allClientsBase.filter(c => c &&`
);

fs.writeFileSync('pages/Compliance/GSTReturn/MonthlyFiling.tsx', c);
