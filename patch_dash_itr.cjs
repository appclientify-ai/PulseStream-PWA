const fs = require('fs');
let content = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

content = content.replace(
  /else if \(type === 'itr'\) \{\s*total = clients\?\.length \|\| 0;/g,
  `else if (type === 'itr') {\n      const applicable = (clients || []).filter(c => c && c.itProfile && (c.status === 'Active' || c.status === 'Active Filing'));\n      total = applicable.length;`
);

// We should also replace the `clients` reference for `filed`:
// `filed = (clients || []).filter(c => periodData[c.id]?.filed).length;`
content = content.replace(
  /filed = \(clients \|\| \[\]\)\.filter\(c => periodData\[c\.id\]\?\.filed\)\.length;\s*\}/g,
  `filed = applicable.filter(c => periodData[c.id]?.filed).length;\n    }`
);

fs.writeFileSync('pages/Primary/Dashboard.tsx', content);
