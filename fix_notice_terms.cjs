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

            if (content.includes('>Mark Filed<')) {
                content = content.replace(/'Filed'\)} className="(w-full text-left px-3 py-2 text-\[9px\] font-black uppercase rounded-lg hover:bg-emerald-50 text-emerald-600)">Mark Filed</g, "'Filed')} className=\"$1\">Reply Filed<");
                modified = true;
            }

            if (content.includes('>Deadline<')) {
                content = content.replace(/<div className="flex items-center gap-1">Deadline <button/g, '<div className="flex items-center gap-1">Due Date <button');
                content = content.replace(/>Deadline<\/p>/g, '>Due Date</p>');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

processDir('pages/LitigationSuite');
console.log("Updated terms.");
