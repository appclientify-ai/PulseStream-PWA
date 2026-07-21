const fs = require('fs');

const files = [
  'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
  'pages/Compliance/GSTReturn/CompositionFiling.tsx',
  'pages/Compliance/AnnualReturns/GSTR4.tsx',
  'pages/Compliance/AnnualReturns/GSTR9_9C.tsx',
  'pages/ClientHub/GstMasterPortfolio.tsx'
];

files.forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  // We need to add `)}` right before `</tbody>` if it's missing.
  // GstMasterPortfolio has `})()` followed by `</tbody>`. We should change `})()` to `})()\n              )}`
  // Actually let's look at `CompositionFiling.tsx`: it has `})()\n            </tbody>`.
  
  c = c.replace(/\}\)\(\)\s*<\/tbody>/g, 
    `})()
              )}
            </tbody>`);

  fs.writeFileSync(file, c);
  console.log(`Fixed ${file}`);
});
