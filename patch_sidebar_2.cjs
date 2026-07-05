const fs = require('fs');
const file = 'components/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /className=\{\`fixed z-\[80\] bg-slate-900 text-white rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200 min-w-\[180px\] border border-white\/10 \$\{isCollapsed \? 'left-20 pl-4' : 'left-80 pl-4'\} ml-2\`\}/g,
    `className={\`fixed z-[80] \${isCollapsed ? 'left-20' : 'left-80'} pl-2\`}`
);

content = content.replace(
    /<div className="absolute left-0 top-6 -ml-1\.5 h-3 w-3 -translate-y-1\/2 rotate-45 bg-slate-900 border-l border-b border-white\/10" \/>/g,
    `<div className="absolute left-2 top-6 -ml-1.5 h-3 w-3 -translate-y-1/2 rotate-45 bg-slate-900 border-l border-b border-white/10" />`
);

content = content.replace(
    /<div className="relative z-10">/g,
    `<div className="relative z-10 bg-slate-900 text-white rounded-xl shadow-2xl p-3 border border-white/10 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">`
);

fs.writeFileSync(file, content);
console.log('patched');
