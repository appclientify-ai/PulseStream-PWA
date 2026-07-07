const fs = require('fs');

function formatClipboardText(file) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    if (content.includes('regDate') || content.includes('dob')) {
        if (!content.includes('formatDate')) {
            const depth = file.split('/').length - 1;
            const upDirs = Array(depth).fill('..').join('/');
            const importPath = `${upDirs}/exportUtils`;
            content = content.replace(
                /import (.*?) from '(.*?)';/,
                `import $1 from '$2';\nimport { formatDate } from '${importPath}';`
            );
        }

        const oldRegDate = /\$\{([a-zA-Z0-9_!.!]+\?\.regDate) \|\| 'N\/A'\}/g;
        if (oldRegDate.test(content)) {
            content = content.replace(oldRegDate, "${formatDate($1)}");
            modified = true;
        }

        const oldDob = /\$\{([a-zA-Z0-9_!.!]+\?\.dob) \|\| 'N\/A'\}/g;
        if (oldDob.test(content)) {
            content = content.replace(oldDob, "${formatDate($1)}");
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(file, content);
            console.log('Patched clipboard dates in', file);
        }
    }
}

formatClipboardText('pages/ClientHub/GstMasterPortfolio.tsx');
formatClipboardText('pages/ClientHub/ItMasterPortfolio.tsx');
