const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/GSTReturn/MonthlyFiling.tsx', 'utf8');

c = c.replace(/if \(!client\.gstProfile\) return '---';/g,
  `if (!client || !client.gstProfile) return '---';`
);

fs.writeFileSync('pages/Compliance/GSTReturn/MonthlyFiling.tsx', c);
