const fs = require('fs');
const file = 'pages/Compliance/AnnualReturns/GSTR4.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /        <\/div>\n        <\/div>\n        <div className="relative flex-1 group w-full">/,
    `        </div>\n        <div className="relative flex-1 group w-full">`
);

fs.writeFileSync(file, content);
console.log('fixed GSTR4 div');
