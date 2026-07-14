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
files = files.concat(walkSync('components'));

let patchedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Pattern 1: load(); inside useEffect
  if (content.includes('load();') && content.includes('useEffect(() => {') && !content.includes('clientify_db_change')) {
    content = content.replace(/load\(\);\s*\}\,\s*\[([^\]]*)\]\);/g, (match, deps) => {
      changed = true;
      return `load();\n    const syncHandler = () => { console.log('Syncing data...'); load(); };\n    window.addEventListener('clientify_db_change', syncHandler);\n    return () => window.removeEventListener('clientify_db_change', syncHandler);\n  }, [${deps}]);`;
    });
  }

  // Pattern 2: fetchClients(); inside useEffect
  if (content.includes('fetchClients();') && content.includes('useEffect(() => {') && !content.includes('clientify_db_change')) {
      content = content.replace(/fetchClients\(\);\s*\}\,\s*\[([^\]]*)\]\);/g, (match, deps) => {
        changed = true;
        return `fetchClients();\n    const syncHandler = () => { console.log('Syncing clients...'); fetchClients(); };\n    window.addEventListener('clientify_db_change', syncHandler);\n    return () => window.removeEventListener('clientify_db_change', syncHandler);\n  }, [${deps}]);`;
      });
  }

  // Pattern 3: fetchData(); inside useEffect
  if (content.includes('fetchData();') && content.includes('useEffect(() => {') && !content.includes('clientify_db_change')) {
      content = content.replace(/fetchData\(\);\s*\}\,\s*\[([^\]]*)\]\);/g, (match, deps) => {
        changed = true;
        return `fetchData();\n    const syncHandler = () => { console.log('Syncing data...'); fetchData(); };\n    window.addEventListener('clientify_db_change', syncHandler);\n    return () => window.removeEventListener('clientify_db_change', syncHandler);\n  }, [${deps}]);`;
      });
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
    patchedCount++;
  }
}
console.log('Total globally patched:', patchedCount);
