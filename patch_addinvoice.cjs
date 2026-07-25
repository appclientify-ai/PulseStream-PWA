const fs = require('fs');
let code = fs.readFileSync('pages/Administration/invoice/addinvoice.tsx', 'utf-8');

if (!code.includes('@tanstack/react-query')) {
  code = "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\n" + code;
}

code = code.replace(/const \[clients, setClients\] = useState<Client\[\]>\(\[\]\);/, '');
code = code.replace(/const \[settings, setSettings\] = useState<InvoiceSettings \| null>\(null\);/, '');

const newLogic = `
  const queryClient = useQueryClient();
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => api.getClients(), staleTime: 0 });
  const { data: settings } = useQuery({ queryKey: ['invoice_settings'], queryFn: () => api.getInvoiceSettings(), staleTime: 0 });
`;

const oldEffect = `  useEffect\\(\\(\\) => \\{    const init = async \\(\\) => \\{      const clisPromise = api\\.getClients\\(\\);      const setsPromise = api\\.getInvoiceSettings\\(\\);            const \\[clis, sets\\] = await Promise\\.all\\(\\[clisPromise, setsPromise\\]\\);      setClients\\(clis\\);      setSettings\\(sets\\);            if \\(editingInvoice\\) \\{`;

code = code.replace(new RegExp(oldEffect), newLogic + "\n  useEffect(() => {\n    const init = async () => {\n      if (editingInvoice) {");

code = code.replace(/await api\.saveInvoice\(record\);/g, "await api.saveInvoice(record);\n      queryClient.invalidateQueries({ queryKey: ['invoices'] });\n      queryClient.invalidateQueries({ queryKey: ['category_items', 'invoice'] });");

fs.writeFileSync('pages/Administration/invoice/addinvoice.tsx', code);
