const fs = require('fs');
const files = [
  'pages/LitigationSuite/HighCourt/CourtPending.tsx',
  'pages/LitigationSuite/Tribunal/TribunalPending.tsx',
  'pages/LitigationSuite/GSTAppeals/AppealPending.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/const \[statusFilter, setStatusFilter\] = useState<string>\("All"\);\n/g, '');
  fs.writeFileSync(f, content);
});
console.log("Fixed duplicates");
