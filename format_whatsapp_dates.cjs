const fs = require('fs');
const execSync = require('child_process').execSync;

const files = execSync('grep -rl "shareViaWhatsApp" pages/').toString().split('\n').filter(Boolean);

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Check if exportUtils is imported
    if (content.includes('regDate') || content.includes('dob')) {
        if (!content.includes('formatDate')) {
            // Need to figure out relative path to exportUtils
            const depth = file.split('/').length - 1;
            const upDirs = Array(depth).fill('..').join('/');
            const importPath = `${upDirs}/exportUtils`;
            content = content.replace(
                /import (.*?) from '(.*?)';/,
                `import $1 from '$2';\nimport { formatDate } from '${importPath}';`
            );
        }

        const oldRegDate = /\$\{([a-zA-Z0-9_.]+\?\.regDate) \|\| 'N\/A'\}/g;
        if (oldRegDate.test(content)) {
            content = content.replace(oldRegDate, "${formatDate($1)}");
            modified = true;
        }
        
        const oldDob = /\$\{([a-zA-Z0-9_.]+\?\.dob) \|\| 'N\/A'\}/g;
        if (oldDob.test(content)) {
            content = content.replace(oldDob, "${formatDate($1)}");
            modified = true;
        }
        
        // Let's also format cancelDate if present
        const oldCancelDate = /\$\{([a-zA-Z0-9_.]+\?\.cancelDate) \|\| 'N\/A'\}/g;
        if (oldCancelDate.test(content)) {
            content = content.replace(oldCancelDate, "${formatDate($1)}");
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(file, content);
            console.log('Patched WhatsApp dates in', file);
        }
    }
}
