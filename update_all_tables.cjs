const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const tableFiles = [];
const allFiles = walk('./pages');
allFiles.forEach(f => {
    const data = fs.readFileSync(f, 'utf8');
    if (data.includes('<table')) tableFiles.push(f);
});

tableFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // To be safe, ONLY modify th and td items
  content = content.replace(/<(th|td)([^>]*)>/g, (match, p1, p2) => {
      // Remove hardcoded width
      let newP2 = p2.replace(/\b(w-\[\d+px\]|min-w-[-\w\[\]]+|max-w-\[\d+px\])\b/g, '');
      // Ensure whitespace-nowrap is present for tables so they auto-expand
      if (newP2.includes('className="') && !newP2.includes('whitespace-nowrap')) {
          newP2 = newP2.replace('className="', 'className="whitespace-nowrap ');
      }
      return `<${p1}${newP2}>`;
  });
  
  // also modify table fixed
  content = content.replace(/<table([^>]*) className="([^"]*?)table-fixed([^"]*?)"/g, (match, p1, p2, p3) => {
      return `<table${p1} className="${p2}table-auto overflow-hidden${p3}"`;
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated tables in ${file}`);
});
