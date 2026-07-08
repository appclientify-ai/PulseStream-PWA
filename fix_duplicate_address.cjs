const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("email: '',\\n        address: '',\\n      address: '',", "email: '',\n      address: '',");
  content = content.replace(/email: '',\n\s*address: '',\n\s*address: '',/g, "email: '',\n    address: '',");
  content = content.replace(/email: '', address: '',\n\s*address: '',/g, "email: '', address: '',");
  fs.writeFileSync(file, content);
}

fix('pages/Clientform/GSTClientFormModal.tsx');
fix('pages/Clientform/ITClientFormModal.tsx');
console.log("Fixed duplicate keys");
