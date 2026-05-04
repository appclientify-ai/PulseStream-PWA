const fs = require('fs');

function processFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  let changed = false;

  // Let's find "overflow-x-auto" and if it doesn't have min-h, add min-h-[350px]
  if (content.includes('overflow-x-auto') && !content.includes('min-h-[250px]')) {
    content = content.replace(/className="([^"]*overflow-x-auto[^"]*)"/g, (match, p1) => {
      if (p1.includes('min-h-')) return match; // already has min-h limit
      return `className="${p1} min-h-[300px]"`;
    });
    changed = true;
  }

  if (content.includes('absolute top-full')) {
    content = content.replace(/absolute top-full(.*) mt-1/g, 'absolute top-0 -translate-y-full$1 mb-1');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(path, content);
    console.log("Fixed", path);
  }
}

// Find all tsx files in pages
const execSync = require('child_process').execSync;
const files = execSync('find pages -type f -name "*.tsx"').toString().trim().split('\n');
files.forEach(f => {
  if (f) processFile(f);
});

console.log("Done");
