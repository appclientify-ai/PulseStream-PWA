const fs = require('fs');
let content = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

// Ensure react-router-dom is imported
if (!content.includes('import { useParams, useNavigate } from \'react-router-dom\';')) {
  content = content.replace("import React,", "import { useParams, useNavigate } from 'react-router-dom';\nimport React,");
}

// Replace activeView state
const activeViewMatch = `const [activeView, setActiveView] = useState<ActiveView>('dashboard');`;
const routerHook = `
  const { view } = useParams<{ view: string }>();
  const navigate = useNavigate();
  const activeView = (view as ActiveView) || 'dashboard';
`;
content = content.replace(activeViewMatch, routerHook.trim());

// Modify handleViewChange
const viewChangeMatch = `
  const handleViewChange = (view: ActiveView, extra?: any) => {
    setActiveView(view);
    setViewExtra(extra || null);
    setNavigationFolder(null); // Close navigation modal if open
    window.scrollTo(0, 0);
  };
`;
const newViewChange = `
  const handleViewChange = (view: ActiveView, extra?: any) => {
    navigate(\`/\${view}\`);
    setViewExtra(extra || null);
    setNavigationFolder(null);
    window.scrollTo(0, 0);
  };
`;
// We might need to make it more robust if the exact string doesn't match perfectly.
const vci1 = content.indexOf('const handleViewChange = (view: ActiveView, extra?: any) => {');
const vci2 = content.indexOf('};', vci1) + 2;
if (vci1 > -1) {
  content = content.substring(0, vci1) + newViewChange.trim() + content.substring(vci2);
}

fs.writeFileSync('pages/Primary/Dashboard.tsx', content);
