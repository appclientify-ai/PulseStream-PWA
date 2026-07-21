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

  // Let's replace the broken closing block with the correct one.
  // The broken string I inserted: `})} </React.Fragment>))})()}`
  
  c = c.replace(/\}\)\} <\/React\.Fragment>\)\)\}\)\(\)\}/g, 
    `})}
                    </React.Fragment>
                  ));
                })()`);

  fs.writeFileSync(file, c);
  console.log(`Fixed ${file}`);
});
