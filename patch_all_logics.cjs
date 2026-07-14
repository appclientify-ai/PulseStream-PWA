const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
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

const files = walkSync('pages/Compliance');
files.push('pages/Administration/DueDateSetting.tsx');

let patchedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Let's look for standard patterns: `load(); \n  }, [`
  // Or `load();\n  }, []`
  // We'll use a regex that matches `load();` or `fetchClients();` and the ending `}, [deps]);`

  // Let's replace simple `load();` and `fetchClients();` inside useEffects if we find them.
  // Actually, string replacement is safer.
  
  if (content.includes('load();') && content.includes('useEffect(() => {') && !content.includes('clientify_db_change')) {
    content = content.replace(/load\(\);\s*\}\,\s*\[([^\]]*)\]\);/g, (match, deps) => {
      changed = true;
      return `load();\n    const syncHandler = () => load();\n    window.addEventListener('clientify_db_change', syncHandler);\n    return () => window.removeEventListener('clientify_db_change', syncHandler);\n  }, [${deps}]);`;
    });
  }

  if (content.includes('fetchClients();') && content.includes('useEffect(() => {') && !content.includes('clientify_db_change')) {
      content = content.replace(/fetchClients\(\);\s*\}\,\s*\[([^\]]*)\]\);/g, (match, deps) => {
        changed = true;
        return `fetchClients();\n    const syncHandler = () => fetchClients();\n    window.addEventListener('clientify_db_change', syncHandler);\n    return () => window.removeEventListener('clientify_db_change', syncHandler);\n  }, [${deps}]);`;
      });
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
    patchedCount++;
  }
}
console.log('Total patched:', patchedCount);
