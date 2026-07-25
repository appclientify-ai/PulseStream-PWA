const fs = require('fs');
let code = fs.readFileSync('pages/Administration/invoice/ClientLedger.tsx', 'utf-8');

if (!code.includes('@tanstack/react-query')) {
  code = "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\n" + code;
}

code = code.replace(/const \[clients, setClients\] = useState<Client\[\]>\(\[\]\);/, '');
code = code.replace(/const \[invoices, setInvoices\] = useState<InvoiceRecord\[\]>\(\[\]\);/, '');
code = code.replace(/const \[payments, setPayments\] = useState<PaymentRecord\[\]>\(\[\]\);/, '');
code = code.replace(/const \[settings, setSettings\] = useState<InvoiceSettings \| null>\(null\);/, '');
code = code.replace(/const \[isLoading, setIsLoading\] = useState\(true\);/, '');

const newLogic = `
  const queryClient = useQueryClient();
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({ queryKey: ['clients'], queryFn: () => api.getClients(), staleTime: 0 });
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({ queryKey: ['invoices'], queryFn: () => api.getInvoices(), staleTime: 0 });
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({ queryKey: ['payments'], queryFn: () => api.getPayments(), staleTime: 0 });
  const { data: settings, isLoading: isLoadingSettings } = useQuery({ queryKey: ['invoice_settings'], queryFn: () => api.getInvoiceSettings(), staleTime: 0 });
  const isLoading = isLoadingClients || isLoadingInvoices || isLoadingPayments || isLoadingSettings;

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => api.deletePayment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] })
  });

  const settleInvoiceMutation = useMutation({
    mutationFn: (id: string) => api.updateInvoice(id, { paymentStatus: 'Paid', balanceDue: 0 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] })
  });
`;

const oldFetch = `  const fetchData = async \\(isSync = false\\)[\\s\\S]*?\\};\\s*useEffect\\(\\(\\) => \\{    fetchData\\(\\);[\\s\\S]*?return \\(\\) => window\\.removeEventListener\\('clientify_db_change', syncHandler\\);\\s*\\}, \\[\\]\\);`;

code = code.replace(new RegExp(oldFetch), newLogic);
code = code.replace(/await api\.deletePayment\(rec\.id\);/g, "await deletePaymentMutation.mutateAsync(rec.id);");
code = code.replace(/await api\.updateInvoice\(rec\.id, \{ paymentStatus: 'Paid', balanceDue: 0 \}\);/g, "await settleInvoiceMutation.mutateAsync(rec.id);");
code = code.replace(/const \[invs, pmts\] = await Promise\.all\(\[\s*api\.getInvoices\(\),\s*api\.getPayments\(\)\s*\]\);\s*setInvoices\(invs\);\s*setPayments\(pmts\);/g, "queryClient.invalidateQueries({ queryKey: ['invoices'] }); queryClient.invalidateQueries({ queryKey: ['payments'] });");

fs.writeFileSync('pages/Administration/invoice/ClientLedger.tsx', code);
