const fs = require('fs');
let code = fs.readFileSync('pages/Administration/invoice/Invoices.tsx', 'utf-8');

if (!code.includes('@tanstack/react-query')) {
  code = "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\n" + code;
}

code = code.replace(/const \[settings, setSettings\] = useState<InvoiceSettings \| null>\(null\);/, '');

const newLogic = `
  const { data: settings } = useQuery({ queryKey: ['invoice_settings'], queryFn: () => api.getInvoiceSettings(), staleTime: 0 });
`;

code = code.replace(/const \[settlingInvoice, setSettlingInvoice\] = useState<InvoiceRecord \| null>\(null\);/, newLogic + "\n  const [settlingInvoice, setSettlingInvoice] = useState<InvoiceRecord | null>(null);");

code = code.replace(/useEffect\(\(\) => \{\s*api\.getInvoiceSettings\(\)\.then\(sets => setSettings\(sets\)\)\.catch\(\(\) => \{\}\);\s*\}, \[\]\);/, '');

fs.writeFileSync('pages/Administration/invoice/Invoices.tsx', code);
