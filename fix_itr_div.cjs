const fs = require('fs');
const file = 'pages/Compliance/ITAudit/ITRReturn.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /        <\/div>\n        <\/div>\n\n        <div className="relative flex-1 group w-full">/,
    `        </div>\n\n        <div className="relative flex-1 group w-full">`
);

fs.writeFileSync(file, content);
console.log('fixed ITR div');
