const fs = require('fs');
const execSync = require('child_process').execSync;

const files = execSync('grep -rl "absolute top-full" pages/').toString().trim().split('\n');

files.forEach(file => {
  if (!file) return;
  console.log("Processing", file);
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('overflow-x-auto')) {
     content = content.replace(/className="([^"]*overflow-x-auto[^"]*)"/g, (match, p1) => {
       if (p1.includes('min-h-[300px]')) return match;
       return `className="${p1} min-h-[300px] pb-32"`;
     });
     fs.writeFileSync(file, content);
  }
});
console.log("Done fixed absolute top-full clipping.");
