const fs = require('fs');
const file = 'types.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('address?: string; // Client address')) {
  content = content.replace('email: string;\n  status: ClientStatus;', 'email: string;\n  address?: string; // Client address\n  status: ClientStatus;');
  fs.writeFileSync(file, content);
  console.log("Patched types.ts");
}
