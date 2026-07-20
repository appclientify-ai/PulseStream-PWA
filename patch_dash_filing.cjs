const fs = require('fs');
let c = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

const regex = /    useEffect\(\(\) => \{\n    const loadFilingData = async \(\) => \{([\s\S]*?)    \};\n    loadFilingData\(\);\n  \}, \[\]\);/m;

const match = c.match(regex);
if (match) {
  const replacement = `  const loadFilingData = async () => {${match[1]}  };
  useEffect(() => { loadFilingData(); }, []);`;
  c = c.replace(regex, replacement);
  fs.writeFileSync('pages/Primary/Dashboard.tsx', c);
  console.log("Patched loadFilingData extraction");
} else {
  console.log("Regex not matched");
}
