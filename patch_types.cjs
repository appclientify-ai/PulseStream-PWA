const fs = require('fs');
let content = fs.readFileSync('types.ts', 'utf8');
content = content.replace(/bankName: string;/g, 'accountName?: string;\n  bankName: string;');
fs.writeFileSync('types.ts', content);
