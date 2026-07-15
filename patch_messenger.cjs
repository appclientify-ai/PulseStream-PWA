const fs = require('fs');
let content = fs.readFileSync('pages/Administration/Messenger.tsx', 'utf8');

const extraEffect = `\n  useEffect(() => {\n    const syncHandler = () => api.getClients().then(setClients);\n    window.addEventListener('clientify_db_change', syncHandler);\n    return () => window.removeEventListener('clientify_db_change', syncHandler);\n  }, []);\n`;

content = content.replace("  const filteredClients = ", extraEffect + "  const filteredClients = ");
fs.writeFileSync('pages/Administration/Messenger.tsx', content);
