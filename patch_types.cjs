const fs = require('fs');
const file = 'types.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "clientTradeName?: string;",
  "clientTradeName?: string;\n  clientGstin?: string;"
);
fs.writeFileSync(file, content);
console.log("Patched types.ts");
