const fs = require('fs');

function addImport(file, relativePath) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('formatDate')) {
        content = content.replace(
            /import (.*?) from 'react';/,
            `import $1 from 'react';\nimport { formatDate } from '${relativePath}';`
        );
        fs.writeFileSync(file, content);
        console.log('Added import to', file);
    }
}

addImport('pages/Compliance/GSTReturn/MonthlyFiling.tsx', '../../../exportUtils');
addImport('pages/Compliance/GSTReturn/QuarterlyFiling.tsx', '../../../exportUtils');
addImport('pages/Compliance/GSTReturn/CompositionFiling.tsx', '../../../exportUtils');
