const fs = require('fs');

const files = [
  'pages/LitigationSuite/GSTNotices/NoticePending.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeFiled.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeDrop.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeDemand.tsx',
  'pages/LitigationSuite/Tribunal/TribunalFiled.tsx',
  'pages/LitigationSuite/Tribunal/TribunalPending.tsx',
  'pages/LitigationSuite/Tribunal/TribunalDemand.tsx',
  'pages/LitigationSuite/GSTAppeals/AppealDemand.tsx',
  'pages/LitigationSuite/GSTAppeals/AppealPending.tsx',
  'pages/LitigationSuite/HighCourt/CourtPending.tsx',
  'pages/LitigationSuite/HighCourt/CourtDemand.tsx',
  'pages/LitigationSuite/HighCourt/CourtFiled.tsx'
];

for(const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/animate-in zoom-in-95 text-left"/g, 'animate-in zoom-in-95 text-left flex flex-col"');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
