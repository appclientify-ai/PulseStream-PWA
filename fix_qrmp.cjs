const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/GSTReturn/QuarterlyFiling.tsx', 'utf8');

c = c.replace(/const checkQrmpVisibility = \(c: Client\) => \{\s*if \(!c\.gstProfile\) return false;/g,
  `const checkQrmpVisibility = (c: Client) => {\n    if (!c || !c.gstProfile) return false;`
);

fs.writeFileSync('pages/Compliance/GSTReturn/QuarterlyFiling.tsx', c);
