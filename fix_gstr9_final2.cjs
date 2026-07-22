const fs = require('fs');

let c = fs.readFileSync('pages/Compliance/AnnualReturns/GSTR9_9C.tsx', 'utf8');

c = c.replace(/<\/React\.Fragment>\s*\}\)\}\s*<\/React\.Fragment>\s*\}\)\}\s*<\/tbody>/,
`</React.Fragment>
              ))}
            </tbody>`);

fs.writeFileSync('pages/Compliance/AnnualReturns/GSTR9_9C.tsx', c);
