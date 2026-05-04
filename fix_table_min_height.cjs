const fs = require('fs');
const execSync = require('child_process').execSync;

function fixOverflows(path) {
  let content = fs.readFileSync(path, 'utf8');
  let changed = false;

  // For any div containing the table, if it has overflow-x-auto, add min-h-[300px]
  if (content.includes('overflow-x-auto') && !content.includes('min-h-[300px]')) {
    content = content.replace(/className="([^"]*overflow-x-auto[^"]*)"/g, (match, p1) => {
      // Don't add multiple times
      if (p1.includes('min-h-')) return match;
      return `className="${p1} min-h-[300px]"`;
    });
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(path, content);
    console.log("Fixed", path);
  }
}

const files = execSync('find pages -type f -name "*.tsx"').toString().trim().split('\n');
files.forEach(f => {
  if (f) fixOverflows(f);
});

console.log("Completed");
