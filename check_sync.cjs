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
let missing = [];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('useEffect(') && (content.includes('api.get') || content.includes('api.fetch') || content.includes('fetchClients(') || content.includes('fetchAll(') || content.includes('fetchRecords(') || content.includes('loadData('))) {
    if (!content.includes('clientify_db_change')) {
      missing.push(file);
    }
  }
}

console.log("Missing clientify_db_change in:", missing);
