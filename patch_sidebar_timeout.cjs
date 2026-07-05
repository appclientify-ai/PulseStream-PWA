const fs = require('fs');
const file = 'components/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('hoverTimeout')) {
    content = content.replace(
        `  const [hoveredItem, setHoveredItem] = useState<{ id: string; top: number; item: NavItem } | null>(null);`,
        `  const [hoveredItem, setHoveredItem] = useState<{ id: string; top: number; item: NavItem } | null>(null);\n  const hoverTimeout = React.useRef<NodeJS.Timeout | null>(null);`
    );

    content = content.replace(
        /const handleMouseEnter = \(e: React.MouseEvent, item: NavItem\) => \{/g,
        `const handleMouseEnter = (e: React.MouseEvent, item: NavItem) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);`
    );

    content = content.replace(
        /onMouseLeave=\{\(\) => setHoveredItem\(null\)\}/g,
        `onMouseLeave={() => { hoverTimeout.current = setTimeout(() => setHoveredItem(null), 150); }}`
    );

    content = content.replace(
        /onMouseEnter=\{\(\) => setHoveredItem\(hoveredItem\)\}/g,
        `onMouseEnter={() => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); }}`
    );
    
    fs.writeFileSync(file, content);
    console.log('patched');
} else {
    console.log('already patched');
}
