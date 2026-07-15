const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('pages');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))')) {
    content = content.replace(
      /\.sort\(\(a, b\) => \(a\.createdAt \|\| 0\) - \(b\.createdAt \|\| 0\)\)/g,
      '.sort((a, b) => (new Date(a.createdAt || 0).getTime()) - (new Date(b.createdAt || 0).getTime()))'
    );
    fs.writeFileSync(file, content);
    console.log('Fixed sort in', file);
  }
}
