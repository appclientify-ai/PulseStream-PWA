const fs = require('fs');
const file = 'pages/Compliance/ITAudit/ITRReturn.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /let total = clients.length;/,
    `const total = clients.length;`
);

fs.writeFileSync(file, content);
console.log('fixed lint');
