const fs = require('fs');
let c = fs.readFileSync('pages/Clientform/GSTClientFormModal.tsx', 'utf8');

c = c.replace(
  /                \)\} placeholder="Range" \/>\s*<\/div>\s*\)\}/,
  `                )}`
);

fs.writeFileSync('pages/Clientform/GSTClientFormModal.tsx', c);
console.log('Fixed GSTClientFormModal');
