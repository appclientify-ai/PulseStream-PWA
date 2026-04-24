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
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./pages/LitigationSuite');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('onDataChange={fetchData}')) {
    content = content.replace(/onDataChange=\{fetchData\}/g, 'onDataChange={fetchAll}');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
