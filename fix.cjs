const fs = require('fs');
let code = fs.readFileSync('pages/Administration/invoice/invoicesetting.tsx', 'utf-8');

// Remove the first settings/isLoading
code = code.replace(/const \[settings, setSettings\] = useState<InvoiceSettings>\(\{[\s\S]*?\}\);\s*const \[isLoading, setIsLoading\] = useState\(true\);/, '');

// Rename the query loading to isQueryLoading, and keep the existing `isLoading` to avoid conflict, or just remove the old one. We already removed it above.
// Actually wait, let's just make sure there's only one.
fs.writeFileSync('pages/Administration/invoice/invoicesetting.tsx', code);
