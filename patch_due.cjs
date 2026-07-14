const fs = require('fs');
let content = fs.readFileSync('pages/Administration/DueDateSetting.tsx', 'utf8');

const updated = `
  const STORAGE_KEY = 'clientify_global_compliance_dates_v1';

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await api.getAppData(STORAGE_KEY);
        if (saved) setDates(saved);
      } catch(e) {}
      setIsLoading(false);
    };
    load();
  }, []);

  const handleDateChange = (moduleId: string, period: string, value: string) => {
    const key = \`\${moduleId}_\${selectedYear}_\${period}\`;
    setDates(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await api.saveAppData(STORAGE_KEY, dates);
    setTimeout(() => setIsSaving(false), 600);
  };
`;

const startIndex = content.indexOf(`  const STORAGE_KEY = 'clientify_global_compliance_dates_v1';`);
const endIndex = content.indexOf(`  const getDateValue =`);

if (startIndex > -1 && endIndex > -1) {
  content = content.substring(0, startIndex) + updated.trim() + '\n\n' + content.substring(endIndex);
  // Also import api if not imported
  if (!content.includes(`import { api }`)) {
     content = `import { api } from '../../services/api';\n` + content;
  }
  fs.writeFileSync('pages/Administration/DueDateSetting.tsx', content);
} else {
  console.log('Could not find block');
}
