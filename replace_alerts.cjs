const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./pages');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('alert(')) {
    // Add import if not exists
    if (!content.includes("import { toast } from 'sonner';")) {
      const importStatement = "import { toast } from 'sonner';\n";
      // Find the last import
      const lines = content.split('\n');
      let lastImportIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, importStatement);
        content = lines.join('\n');
      } else {
        content = importStatement + content;
      }
    }
    
    // Replace alert("...") with toast.error("...") or toast.success("...")
    // Simple heuristic: if it contains "failed" or "Missing" or "Error", use toast.error, else toast.success
    content = content.replace(/alert\((['"])(.*?)\1\)/g, (match, quote, text) => {
      if (text.toLowerCase().includes('fail') || text.toLowerCase().includes('miss') || text.toLowerCase().includes('error')) {
        return `toast.error(${quote}${text}${quote})`;
      } else {
        return `toast.success(${quote}${text}${quote})`;
      }
    });

    // Also handle alert(`...`)
    content = content.replace(/alert\(`(.*?)`\)/g, (match, text) => {
      if (text.toLowerCase().includes('fail') || text.toLowerCase().includes('miss') || text.toLowerCase().includes('error')) {
        return `toast.error(\`${text}\`)`;
      } else {
        return `toast.success(\`${text}\`)`;
      }
    });

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
