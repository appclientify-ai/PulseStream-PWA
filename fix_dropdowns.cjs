const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Replace zoom-in-95" -> zoom-in-95 flex flex-col gap-1"
            if (content.includes('zoom-in-95"')) {
                // To avoid multiple replaces, we replace only the exact string match if flex is missing
                content = content.replace(/zoom-in-95"/g, 'zoom-in-95 flex flex-col gap-1"');
                // Cleanup in case it already had flex
                content = content.replace(/zoom-in-95 flex flex-col gap-1 flex flex-col gap-1"/g, 'zoom-in-95 flex flex-col gap-1"');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

processDir('pages');
console.log("Made dropdowns vertical.");
