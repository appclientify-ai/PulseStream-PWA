const fs = require('fs');

function fixIcon(file) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/const handleEditClick = \(c: Client\) => \{/,
    'const handleEditClick = (c: Client) => {\n    setIsOpen(false);');
  fs.writeFileSync(file, c);
}

fixIcon('components/ITViewIcon.tsx');
fixIcon('components/GSTViewIcon.tsx');
console.log('Fixed icons');
