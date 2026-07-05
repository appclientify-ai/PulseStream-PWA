const fs = require('fs');
const file = 'components/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /const handleMouseEnter = \(e: React.MouseEvent, item: NavItem\) => \{[\s\S]*?setHoveredItem\(\{ id: item.id, top: rect.top, item \}\);\n  \};/,
    `const handleMouseEnter = (e: React.MouseEvent, item: NavItem) => {
    if (!isCollapsed && (!item.children || item.children.length === 0)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({ id: item.id, top: rect.top, item });
  };`
);

content = content.replace(
    /\{isCollapsed && hoveredItem && \(/,
    `{hoveredItem && (isCollapsed || hoveredItem.item.children) && (`
);

content = content.replace(
    /className="fixed left-20 ml-4 z-\[80\] bg-slate-900 text-white rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200 min-w-\[180px\] border border-white\/10"/,
    "className={`fixed z-[80] bg-slate-900 text-white rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200 min-w-[180px] border border-white/10 ${isCollapsed ? 'left-20 pl-4' : 'left-80 pl-4'} ml-2`}"
);

fs.writeFileSync(file, content);
console.log('patched');
