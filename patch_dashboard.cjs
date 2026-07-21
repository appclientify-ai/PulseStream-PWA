const fs = require('fs');

let c = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

c = c.replace(
  /const applicable = \(clients \|\| \[\]\)\.filter\(c => c && c\.gstProfile\?\.regType === 'Regular' && c\.gstProfile\?\.filingFreq === 'Monthly'\);/g,
  `const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Monthly' && (c.status === 'Active' || c.status === 'Active Filing'));`
);

c = c.replace(
  /const applicable = \(clients \|\| \[\]\)\.filter\(c => c && c\.gstProfile\?\.regType === 'Regular' && c\.gstProfile\?\.filingFreq === 'Quarterly'\);/g,
  `const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Quarterly' && (c.status === 'Active' || c.status === 'Active Filing'));`
);

c = c.replace(
  /const applicable = \(clients \|\| \[\]\)\.filter\(c => c && c\.gstProfile\?\.regType === 'Composition'\);/g,
  `const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Composition' && (c.status === 'Active' || c.status === 'Active Filing'));`
);

// Note: gstr4 and gstr9 applicable filters
c = c.replace(
  /const applicable = \(clients \|\| \[\]\)\.filter\(c => c && c\.gstProfile\?\.regType === 'Composition'\);/g,
  `const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Composition' && (c.status === 'Active' || c.status === 'Active Filing'));`
);

c = c.replace(
  /const applicable = \(clients \|\| \[\]\)\.filter\(c => c && c\.gstProfile\?\.regType === 'Regular' && currentWatchlist\.includes\(c\.id\)\);/g,
  `const applicable = (clients || []).filter(c => c && c.gstProfile?.regType === 'Regular' && currentWatchlist.includes(c.id) && (c.status === 'Active' || c.status === 'Active Filing'));`
);

fs.writeFileSync('pages/Primary/Dashboard.tsx', c);
console.log("Patched Dashboard");
