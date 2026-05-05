const fs = require('fs');
const execSync = require('child_process').execSync;

const files = execSync('grep -rl "bottom-full" pages/').toString().trim().split('\n');

files.forEach(file => {
  if (!file) return;
  console.log("Processing", file);
  let content = fs.readFileSync(file, 'utf8');
  
  // They requested table filters to go UP so they don't hide behind row and don't get clipped.
  // We'll revert `absolute bottom-full mb-1 z-[9999]` to `absolute top-full mt-1 z-50`
  
  const modified = content.replace(/className="([^"]*)absolute bottom-full mb-1 z-\[9999\]([^"]*)"/g, (match, p1, p2) => {
    return `className="${p1}absolute top-full mt-1 z-50${p2}"`;
  });
  
  if (content !== modified) {
    fs.writeFileSync(file, modified);
    console.log("Updated", file);
  }
});
console.log("Done");
