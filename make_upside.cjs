const fs = require('fs');
const execSync = require('child_process').execSync;

const files = execSync('grep -rl "absolute top-full" pages/').toString().trim().split('\n');

files.forEach(file => {
  if (!file) return;
  // We only modify the tables and in-row dropdowns
  console.log("Processing", file);
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace absolute top-full with absolute bottom-full mb-1 z-[999]
  // We'll also remove mt-1 or mt-2 to prevent it from moving down.
  const modified = content.replace(/className="([^"]*)absolute top-full([^"]*)mt-[12]?([^"]*)"/g, (match, p1, p2, p3) => {
    // If it already has z-[...], we replace it with z-[9999] to ensure it never hides behind a row.
    let rest = p2 + p3;
    rest = rest.replace(/z-\[?\d+\]?/g, ''); 
    return `className="${p1}absolute bottom-full mb-1 z-[9999] ${rest.trim().replace(/\s+/g, ' ')}"`;
  });
  
  if (content !== modified) {
    fs.writeFileSync(file, modified);
    console.log("Updated", file);
  }
});
console.log("Done");
