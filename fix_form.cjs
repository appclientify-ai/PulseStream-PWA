const fs = require('fs');

let c = fs.readFileSync('pages/Clientform/GSTClientFormModal.tsx', 'utf8');

c = c.replace(/<\/>\s*placeholder="Range" \/>\s*<\/div>\s*\)\}/g, '</>');

fs.writeFileSync('pages/Clientform/GSTClientFormModal.tsx', c);
