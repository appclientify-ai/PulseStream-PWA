const fs = require('fs');

const files = [
  'pages/Clientform/GSTRegistrationForm.tsx',
  'pages/Clientform/FoodLicensesForm.tsx',
  'pages/Clientform/MSMEForm.tsx',
  'pages/Clientform/workForm.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/c\.legalName\.toLowerCase\(\)\.includes\(query\) \|\|\s*c\.tradeName\.toLowerCase\(\)\.includes\(query\)/g, "(c.legalName || '').toLowerCase().includes(query) || (c.tradeName || '').toLowerCase().includes(query)");
    content = content.replace(/c\.legalName\?\.toLowerCase\(\)\?.includes\(query\) \|\|\s*c\.tradeName\?\.toLowerCase\(\)\?.includes\(query\)/g, "(c.legalName || '').toLowerCase().includes(query) || (c.tradeName || '').toLowerCase().includes(query)");
    fs.writeFileSync(file, content);
    console.log("Fixed " + file);
  }
}
