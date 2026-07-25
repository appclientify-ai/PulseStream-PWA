const fs = require('fs');
let code = fs.readFileSync('pages/Administration/invoice/PaymentReceived.tsx', 'utf-8');

if (!code.includes('@tanstack/react-query')) {
  code = "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\n" + code;
}

code = code.replace(/const \[payments, setPayments\] = useState<PaymentRecord\[\]>\(\[\]\);/, '');
code = code.replace(/const \[isLoading, setIsLoading\] = useState\(true\);/, '');
code = code.replace(/const \[settings, setSettings\] = useState<InvoiceSettings \| null>\(null\);/, '');
code = code.replace(/const \[invoices, setInvoices\] = useState<InvoiceRecord\[\]>\(\[\]\);/, '');
code = code.replace(/const \[clients, setClients\] = useState<Client\[\]>\(\[\]\);/, '');

const newLogic = `
  const queryClient = useQueryClient();
  const { data: payments = [], isLoading } = useQuery({ queryKey: ['payments'], queryFn: () => api.getPayments(), staleTime: 0 });
  const { data: settings } = useQuery({ queryKey: ['invoice_settings'], queryFn: () => api.getInvoiceSettings(), staleTime: 0 });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => api.getInvoices(), staleTime: 0 });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => api.getClients(), staleTime: 0 });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePayment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] })
  });

  const handleDelete = async (id: string) => { if(confirm('Delete payment record?')) { await deleteMutation.mutateAsync(id); } };
`;

code = code.replace(/const handleDelete = async \(id: string\) => {[^}]*};\n/, '');

const oldFetch = `  const fetchAll = async \\(isSync = false\\) => \\{[\\s\\S]*?\\};\\s*useEffect\\(\\(\\) => \\{ fetchAll\\(\\);[\\s\\S]*?return \\(\\) => window\\.removeEventListener\\('clientify_db_change', syncHandler\\);\\s*\\}, \\[\\]\\);`;

code = code.replace(new RegExp(oldFetch), newLogic);

fs.writeFileSync('pages/Administration/invoice/PaymentReceived.tsx', code);
