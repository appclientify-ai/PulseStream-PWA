const fs = require('fs');
const file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /<main className=\{\`flex flex-1 flex-col overflow-hidden relative transition-all duration-500 \$\{isSidebarCollapsed \? 'ml-24' : 'ml-72'\}\`\}>/,
    `<main className={\`flex flex-1 flex-col overflow-hidden relative transition-all duration-500 \${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-72'}\`}>`
);

fs.writeFileSync(file, content);
console.log('Patched Dashboard mobile');
