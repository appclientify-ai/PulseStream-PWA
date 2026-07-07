const fs = require('fs');

function fixImport(file, relativePath) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('formatDate') && !content.includes('import { formatDate }')) {
        content = content.replace(
            /import (.*?) from 'react';/,
            `import $1 from 'react';\nimport { formatDate } from '${relativePath}';`
        );
        fs.writeFileSync(file, content);
        console.log('Fixed import in', file);
    }
}

fixImport('pages/Compliance/GSTReturn/MonthlyFiling.tsx', '../../../exportUtils');
fixImport('pages/Compliance/GSTReturn/QuarterlyFiling.tsx', '../../../exportUtils');
fixImport('pages/Compliance/GSTReturn/CompositionFiling.tsx', '../../../exportUtils');
