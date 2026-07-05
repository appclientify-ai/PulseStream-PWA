const fs = require('fs');
const file = 'components/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /const handleItemClick = \(item: NavItem\) => \{[\s\S]*?onViewChange\(item\.id as ActiveView\);\n    \}\n  \};/,
    `const handleItemClick = (e: React.MouseEvent, item: NavItem) => {
    if (item.children?.length) {
      if (hoveredItem?.id === item.id) {
        setHoveredItem(null);
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredItem({ id: item.id, top: rect.top, item });
      }
    } else {
      onViewChange(item.id as ActiveView);
    }
  };`
);

content = content.replace(
    /onClick=\{\(\) => handleItemClick\(item\)\}/,
    `onClick={(e) => handleItemClick(e, item)}`
);

fs.writeFileSync(file, content);
console.log('patched Sidebar click');
