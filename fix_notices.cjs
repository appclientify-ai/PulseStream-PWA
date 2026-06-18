const fs = require('fs');
const files = [
  'pages/LitigationSuite/GSTNotices/NoticePending.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeFiled.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeDrop.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeDemand.tsx',
  'pages/LitigationSuite/GSTAppeals/AppealPending.tsx',
  'pages/LitigationSuite/GSTAppeals/AppealFiled.tsx',
  'pages/LitigationSuite/GSTAppeals/AppealDrop.tsx',
  'pages/LitigationSuite/GSTAppeals/AppealDemand.tsx',
  'pages/LitigationSuite/HighCourt/CourtPending.tsx',
  'pages/LitigationSuite/HighCourt/CourtFiled.tsx',
  'pages/LitigationSuite/HighCourt/CourtDrop.tsx',
  'pages/LitigationSuite/HighCourt/CourtDemand.tsx',
  'pages/LitigationSuite/Tribunal/TribunalPending.tsx',
  'pages/LitigationSuite/Tribunal/TribunalFiled.tsx',
  'pages/LitigationSuite/Tribunal/TribunalDrop.tsx',
  'pages/LitigationSuite/Tribunal/TribunalDemand.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    let lines = content.split('\n');
    for(let i = 0; i < lines.length; i++) {
        // Find if line has uppercase and contains variables like clientName, referenceNo, taxPeriod, username, etc.
        // Also if it's `{rec.section ? `U/s ${rec.section}` : '---'}`
        if(lines[i].includes('uppercase') && lines[i].match(/(clientName|referenceNo|taxPeriod|rec\.section)/)) {
            lines[i] = lines[i].replace(/\buppercase\b/g, '');
        }
    }
    content = lines.join('\n');
    // clean up space
    content = content.replace(/className="([^"]+)"/g, (match, p1) => {
        return 'className="' + p1.replace(/\s+/g, ' ').trim() + '"';
    });
    
    fs.writeFileSync(file, content, 'utf8');
});
