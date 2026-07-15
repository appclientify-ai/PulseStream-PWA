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

let patchedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // We want to pass a boolean to fetchClients, fetchAll, etc.
  // We'll change `const fetchClients = async () => { setIsLoading(true);` 
  // to `const fetchClients = async (isSync = false) => { if(!isSync) setIsLoading(true);`
  
  const replacements = [
    { name: 'fetchClients', regex: /const fetchClients = async \(\) => \{\s*setIsLoading\(true\);/g, replacement: 'const fetchClients = async (isSync = false) => {\n    if (!isSync) setIsLoading(true);' },
    { name: 'fetchAll', regex: /const fetchAll = async \(\) => \{\s*setIsLoading\(true\);/g, replacement: 'const fetchAll = async (isSync = false) => {\n    if (!isSync) setIsLoading(true);' },
    { name: 'fetchRecords', regex: /const fetchRecords = async \(\) => \{\s*setIsLoading\(true\);/g, replacement: 'const fetchRecords = async (isSync = false) => {\n    if (!isSync) setIsLoading(true);' },
    { name: 'fetchRegistrations', regex: /const fetchRegistrations = async \(\) => \{\s*setIsLoading\(true\);/g, replacement: 'const fetchRegistrations = async (isSync = false) => {\n    if (!isSync) setIsLoading(true);' },
    { name: 'fetchTrash', regex: /const fetchTrash = async \(\) => \{\s*setIsLoading\(true\);/g, replacement: 'const fetchTrash = async (isSync = false) => {\n    if (!isSync) setIsLoading(true);' },
    { name: 'fetchUnifiedData', regex: /const fetchUnifiedData = async \(\) => \{\s*setIsLoading\(true\);/g, replacement: 'const fetchUnifiedData = async (isSync = false) => {\n    if (!isSync) setIsLoading(true);' }
  ];

  for (const r of replacements) {
    if (r.regex.test(content)) {
      content = content.replace(r.regex, r.replacement);
      
      // Also update the syncHandler to pass true
      const syncRegex = new RegExp(`const syncHandler = \\(\\) => { console\\.log\\('Syncing .*?'\\); ${r.name}\\(\\); };`, 'g');
      content = content.replace(syncRegex, `const syncHandler = () => { console.log('Syncing in background...'); ${r.name}(true); };`);
      
      const syncRegex2 = new RegExp(`const syncHandler = \\(\\) => ${r.name}\\(\\);`, 'g');
      content = content.replace(syncRegex2, `const syncHandler = () => ${r.name}(true);`);

      const syncRegex3 = new RegExp(`const syncHandler = \\(\\) => \\{ ${r.name}\\(\\); \\};`, 'g');
      content = content.replace(syncRegex3, `const syncHandler = () => { ${r.name}(true); };`);
      
      changed = true;
    }
  }

  // Also in Dashboard, loadData
  if (file.includes('Dashboard.tsx')) {
    if (content.includes('const loadData = useCallback(async () => {') && !content.includes('const loadData = useCallback(async (isSync = false) => {')) {
        content = content.replace('const loadData = useCallback(async () => {', 'const loadData = useCallback(async (isSync = false) => {');
        content = content.replace(/const syncHandler = \(\) => \{ console\.log\('Syncing main dashboard data\.\.\.'\); loadData\(\); \};/g, `const syncHandler = () => { console.log('Syncing main dashboard data...'); loadData(true); };`);
        changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
    patchedCount++;
  }
}
console.log('Total globally patched for loaders:', patchedCount);
