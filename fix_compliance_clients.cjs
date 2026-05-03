const fs = require('fs');
const files = [
  'pages/Compliance/GSTReturn/MonthlyFiling.tsx',
  'pages/Compliance/GSTReturn/CompositionFiling.tsx',
  'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
  'pages/Compliance/AnnualReturns/GSTR4.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/data\.filter\(c => c\./g, '(data || []).filter(c => c && c.');
  fs.writeFileSync(file, content);
});
console.log("Fixed compliance files");
