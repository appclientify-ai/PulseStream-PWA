const fs = require('fs');
let code = fs.readFileSync('pages/Administration/invoice/invoicesetting.tsx', 'utf-8');

if (!code.includes('@tanstack/react-query')) {
  code = "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\n" + code;
}

code = code.replace(/const \[settings, setSettings\] = useState<InvoiceSettings>\\([\\s\\S]*?\\}\\);/, '');
code = code.replace(/const \[isLoading, setIsLoading\] = useState\\(true\\);/, '');

const newLogic = `
  const queryClient = useQueryClient();
  const { data: initialSettings, isLoading } = useQuery({ queryKey: ['invoice_settings'], queryFn: () => api.getInvoiceSettings(), staleTime: 0 });
  const [settings, setSettings] = useState<InvoiceSettings>({} as any);

  useEffect(() => {
    if (initialSettings) setSettings(initialSettings);
  }, [initialSettings]);
`;

const oldEffect = `  useEffect\\(\\(\\) => \\{\\s*api\\.getInvoiceSettings\\(\\)\\.then\\(data => \\{\\s*setSettings\\(data\\);\\s*setIsLoading\\(false\\);\\s*\\}\\);\\s*\\}, \\[\\]\\);`;

code = code.replace(new RegExp(oldEffect), newLogic);
code = code.replace('await api.saveInvoiceSettings(settings);', "await api.saveInvoiceSettings(settings);\n      queryClient.invalidateQueries({ queryKey: ['invoice_settings'] });");

fs.writeFileSync('pages/Administration/invoice/invoicesetting.tsx', code);
