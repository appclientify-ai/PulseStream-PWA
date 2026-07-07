const fs = require('fs');

function findAndPatch(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = dir + '/' + file;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            findAndPatch(fullPath);
        } else if (file.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            if (content.includes('issueDate') || content.includes('dueDate') || content.includes('hearingDate') || content.includes('orderDate') || content.includes('date}')) {
                if (!content.includes('import { formatDate }')) {
                     content = content.replace(
                        /import (.*?) from '(.*?)';/,
                        "import $1 from '$2';\nimport { formatDate } from '../../../exportUtils';"
                     );
                     // If it fails because of relative path, adjust it
                }
                
                // Replace values
                const regexes = [
                   /\{notice\.issueDate\}/g,
                   /\{notice\.dueDate\}/g,
                   /\{notice\.hearingDate\}/g,
                   /\{notice\.orderDate\}/g,
                   /\{appeal\.issueDate\}/g,
                   /\{appeal\.dueDate\}/g,
                   /\{appeal\.hearingDate\}/g,
                   /\{appeal\.orderDate\}/g,
                   /\{case\.issueDate\}/g,
                   /\{caseItem\.issueDate\}/g,
                   /\{caseItem\.dueDate\}/g,
                   /\{caseItem\.hearingDate\}/g,
                   /\{caseItem\.orderDate\}/g,
                   /\{getStatus\(c\.id\)\.date\}/g
                ];

                for (let i = 0; i < regexes.length; i++) {
                   const r = regexes[i];
                   const sourceStr = r.source.replace(/\\/g, ''); // get literal like {notice.issueDate}
                   const inner = sourceStr.replace('{', '').replace('}', '');
                   
                   if (r.test(content)) {
                       content = content.replace(r, `{formatDate(${inner})}`);
                       modified = true;
                   }
                }

                if (modified) {
                     // Check if exportUtils path is correct for pages/LitigationSuite/*/*.tsx
                     if (content.includes("import { formatDate } from '../../../exportUtils';")) {
                          // it's correct for pages/LitigationSuite/GSTNotices/NoticePending.tsx
                     } else {
                          // Fallback injection if the top import didn't work
                          if (!content.includes('import { formatDate }')) {
                               content = "import { formatDate } from '../../../exportUtils';\n" + content;
                          }
                     }
                     
                     fs.writeFileSync(fullPath, content);
                     console.log('Patched dates in', fullPath);
                }
            }
        }
    }
}

findAndPatch('pages/LitigationSuite');
