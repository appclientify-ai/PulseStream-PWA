const fs = require('fs');

function fixCrash(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/externalSearch\.toLowerCase\(\)/g, "(externalSearch || '').toLowerCase()");
    content = content.replace(/c\.mobile(\s*&&\s*c\.mobile)\.includes\(s\)/g, "String(c.mobile || '').includes(s)");
    content = content.replace(/\(c\.mobile \|\| ''\)\.includes\(s\)/g, "String(c.mobile || '').includes(s)");
    fs.writeFileSync(file, content, 'utf8');
}

fixCrash('pages/ClientHub/GstMasterPortfolio.tsx');
fixCrash('pages/ClientHub/ItMasterPortfolio.tsx');
console.log('Fixed crashes.');
