const fs = require('fs');

function patch(file) {
  let c = fs.readFileSync(file, 'utf8');
  // Just aggressively protect any access to c.gstProfile or client.gstProfile where it might cause a crash
  // Like `client.gstProfile.jurisdictionType`
  c = c.replace(/const isState = client\.gstProfile\.jurisdictionType === 'State';/g, "const isState = client?.gstProfile?.jurisdictionType === 'State';");
  c = c.replace(/client\.gstProfile\.sector/g, "client?.gstProfile?.sector");
  c = c.replace(/client\.gstProfile\.range/g, "client?.gstProfile?.range");
  c = c.replace(/client\.gstProfile\.cancelDate/g, "client?.gstProfile?.cancelDate");
  c = c.replace(/client\.gstProfile\.gstStatus/g, "client?.gstProfile?.gstStatus");
  fs.writeFileSync(file, c);
}

patch('pages/Compliance/GSTReturn/MonthlyFiling.tsx');
patch('pages/Compliance/GSTReturn/QuarterlyFiling.tsx');
patch('pages/Compliance/GSTReturn/CompositionFiling.tsx');
