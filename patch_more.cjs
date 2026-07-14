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

let files = walkSync('pages');

let patchedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  const triggers = ['fetchAll();', 'fetchUnifiedData();', 'fetchTrash();', 'fetchRecords();', 'fetchRegistrations();'];

  for (const trig of triggers) {
      if (content.includes(trig) && content.includes('useEffect(() => {') && !content.includes('clientify_db_change')) {
          const regex = new RegExp(trig.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\;/g, '\\;') + '\\s*\\}\\,\\s*\\[([^\\]]*)\\]\\);', 'g');
          content = content.replace(regex, (match, deps) => {
            changed = true;
            return `${trig}\n    const syncHandler = () => { console.log('Syncing data...'); ${trig} };\n    window.addEventListener('clientify_db_change', syncHandler);\n    return () => window.removeEventListener('clientify_db_change', syncHandler);\n  }, [${deps}]);`;
          });
          
          // Also check for inline ones: useEffect(() => { fetchAll(); }, []);
          const regexInline = new RegExp('useEffect\\(\\(\\)\\s*=>\\s*\\{\\s*' + trig.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\;/g, '\\;') + '\\s*\\}\\,\\s*\\[([^\\]]*)\\]\\);', 'g');
          content = content.replace(regexInline, (match, deps) => {
            changed = true;
            return `useEffect(() => { ${trig} const syncHandler = () => { ${trig} }; window.addEventListener('clientify_db_change', syncHandler); return () => window.removeEventListener('clientify_db_change', syncHandler); }, [${deps}]);`;
          });
      }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
    patchedCount++;
  }
}
console.log('Total globally patched more:', patchedCount);
