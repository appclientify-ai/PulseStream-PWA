const fs = require('fs');

const files = [
  'pages/Compliance/GSTReturn/MonthlyFiling.tsx',
  'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
  'pages/Compliance/GSTReturn/CompositionFiling.tsx',
  'pages/Compliance/AnnualReturns/GSTR4.tsx',
  'pages/Compliance/AnnualReturns/GSTR9_9C.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/overflow-hidden\]/g, 'overflow-hidden');
  content = content.replace(/py-3\]/g, 'py-3');
  content = content.replace(/table-fixed/g, 'table-auto overflow-hidden');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Fixed ${file}`);
});
