const fs = require('fs');
const file = 'pages/Administration/invoice/addinvoice.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove isLoading block
content = content.replace("if (isLoading) return <Loader />;", "// if (isLoading) return <Loader />;");

// 2. Change initial state of isLoading to false, we don't strictly need it but let's keep it for semantic
content = content.replace("const [isLoading, setIsLoading] = useState(true);", "const [isLoading, setIsLoading] = useState(false);");

fs.writeFileSync(file, content);
console.log("Patched addinvoice.tsx to not block on isLoading.");
