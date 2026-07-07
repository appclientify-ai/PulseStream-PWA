const fs = require('fs');
const file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">[\s\S]*?{deadlines\.length > 10 && \([\s\S]*?<\/div>[\s\S]*?<\/div>\n\s*\}\)/, 'MATCH');
