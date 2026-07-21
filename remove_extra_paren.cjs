const fs = require('fs');

const files = [
  'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
  'pages/Compliance/GSTReturn/CompositionFiling.tsx',
  'pages/Compliance/AnnualReturns/GSTR4.tsx',
  'pages/Compliance/AnnualReturns/GSTR9_9C.tsx'
];

files.forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  // Replace `})()\n              )}` with `})()\n              }`
  c = c.replace(/\}\)\(\)\s*\)\}/g, `})()\n              }`);

  fs.writeFileSync(file, c);
  console.log(`Fixed ${file}`);
});
