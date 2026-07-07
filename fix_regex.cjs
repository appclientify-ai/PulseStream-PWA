const fs = require('fs');

const file1 = 'pages/ClientHub/GstMasterPortfolio.tsx';
let content1 = fs.readFileSync(file1, 'utf8');

// There's leftover code from the function. Let's remove lines from the beginning of the leftover until `};\n\nconst GstMasterPortfolio`
content1 = content1.replace(/[\s\S]*?};\nconst GstMasterPortfolio/, 'const GstMasterPortfolio');

fs.writeFileSync(file1, content1);

const file2 = 'pages/ClientHub/ItMasterPortfolio.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/[\s\S]*?};\nconst ItMasterPortfolio/, 'const ItMasterPortfolio');
fs.writeFileSync(file2, content2);
