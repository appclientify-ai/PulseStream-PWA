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
  
  // Actually, I should just fix the mistake first.
  content = content.replace(/text-slate-900\]/g, 'text-slate-900');
  
  // Remove all instances of w-[100px] etc
  content = content.replace(/\s?w-\[\d+px\]/g, '');
  content = content.replace(/\s?min-w-\[\d+px\]/g, '');
  content = content.replace(/\s?max-w-\[\d+px\]/g, '');
  
  // remove table-fixed
  content = content.replace(/\s*table-fixed/g, ' table-auto overflow-hidden');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
});
