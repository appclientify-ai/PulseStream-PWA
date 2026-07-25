const fs = require('fs');
let code = fs.readFileSync('pages/Administration/DueDateSetting.tsx', 'utf-8');

if (!code.includes('@tanstack/react-query')) {
  code = "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\n" + code;
}

code = code.replace(/const \[dates, setDates\] = useState<Record<string, string>>\(\{\}\);/, '');
code = code.replace(/const \[isLoading, setIsLoading\] = useState\(true\);/, '');

const newLogic = `
  const queryClient = useQueryClient();
  const { data: initialDates, isLoading } = useQuery({ queryKey: ['due_dates'], queryFn: () => api.getAppData(STORAGE_KEY), staleTime: 0 });
  const [dates, setDates] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialDates) setDates(initialDates);
  }, [initialDates]);
`;

const oldEffect = `  useEffect\\(\\(\\) => \\{    const load = async \\(\\) => \\{      try \\{        const saved = await api\\.getAppData\\(STORAGE_KEY\\);        if \\(saved\\) setDates\\(saved\\);      \\} catch\\(e\\) \\{ console\\.error\\(e\\); \\}      setIsLoading\\(false\\);    \\};    load\\(\\);    const syncHandler = \\(\\) => load\\(\\);    window\\.addEventListener\\('clientify_db_change', syncHandler\\);    return \\(\\) => window\\.removeEventListener\\('clientify_db_change', syncHandler\\);  \\}, \\[\\]\\);`;

code = code.replace(new RegExp(oldEffect), newLogic);

code = code.replace("await api.patchAppData(STORAGE_KEY, Object.fromEntries(Object.entries(finalDates).map(([k,v]) => [`data.${k}`, v])));", "await api.patchAppData(STORAGE_KEY, Object.fromEntries(Object.entries(finalDates).map(([k,v]) => [`data.${k}`, v])));\n      queryClient.invalidateQueries({ queryKey: ['due_dates'] });");

fs.writeFileSync('pages/Administration/DueDateSetting.tsx', code);
