const fs = require('fs');

function formatCsvText(file) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    if (!content.includes('formatDate')) {
        const depth = file.split('/').length - 1;
        const upDirs = Array(depth).fill('..').join('/');
        const importPath = `${upDirs}/exportUtils`;
        content = content.replace(
            /import (.*?) from '(.*?)';/,
            `import $1 from '$2';\nimport { formatDate } from '${importPath}';`
        );
    }

    if (file.includes('GSTPortfolio')) {
        if (content.includes('c?.gstProfile?.regDate')) {
            content = content.replace(
                /c\?\.gstProfile\?\.regDate/g,
                "formatDate(c?.gstProfile?.regDate)"
            );
            modified = true;
        }
    }
    if (file.includes('ITPortfolio')) {
        if (content.includes('c?.itProfile?.dob')) {
            content = content.replace(
                /c\?\.itProfile\?\.dob/g,
                "formatDate(c?.itProfile?.dob)"
            );
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(file, content);
        console.log('Patched csv dates in', file);
    }
}

formatCsvText('pages/ClientHub/GSTPortfolio.tsx');
formatCsvText('pages/ClientHub/ITPortfolio.tsx');
