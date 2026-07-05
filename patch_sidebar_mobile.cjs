const fs = require('fs');
const file = 'components/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /className=\{\`fixed inset-y-0 left-0 z-\[70\] flex flex-col border-r border-slate-200 bg-white shadow-2xl transition-all duration-500 ease-in-out \$\{[\s\S]*?\}\`\}/,
    `className={\`fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-slate-200 bg-white shadow-2xl transition-all duration-500 ease-in-out md:translate-x-0 \${
          isCollapsed ? '-translate-x-full md:w-20' : 'translate-x-0 w-72'
        }\`}`
);

// We should also add an overlay on mobile if sidebar is open
if (!content.includes('bg-slate-900/50')) {
    content = content.replace(
        /<aside/,
        `{!isCollapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={onToggle}
        />
      )}
      <aside`
    );
}

fs.writeFileSync(file, content);
console.log('Patched Sidebar mobile');
