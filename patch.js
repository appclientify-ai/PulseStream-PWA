const fs = require('fs');
const content = fs.readFileSync('pages/Administration/invoice/invoicesetting.tsx', 'utf8');
const index = content.indexOf('  const handleImageUpload = ');
const insert = `
  const handleDeleteImage = async (field: 'firmLogo' | 'firmSignature') => {
    const updatedSettings = { ...settings, [field]: '' };
    setSettings(updatedSettings);
    setIsSaving(true);
    try {
      await api.saveInvoiceSettings(updatedSettings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };
`;
const newContent = content.slice(0, index) + insert + content.slice(index);
fs.writeFileSync('pages/Administration/invoice/invoicesetting.tsx', newContent);
