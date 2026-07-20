import re
with open('pages/Clientform/GSTClientFormModal.tsx', 'r') as f:
    c = f.read()

# Add state
c = c.replace('  const [showPassword, setShowPassword] = useState(false);', 
              '  const [showPassword, setShowPassword] = useState(false);\n  const [existingClients, setExistingClients] = useState<Client[]>([]);\n  const [isDataLinked, setIsDataLinked] = useState(false);')

# Fetch clients on open
useEffect_pattern = r"  useEffect\(\(\) => \{\n    if \(isOpen\) \{\n      if \(initialData\) \{"
c = re.sub(useEffect_pattern, 
           "  useEffect(() => {\n    if (isOpen) {\n      api.getClients().then(setExistingClients);\n      if (initialData) {", c)

# Reset isDataLinked in resetForm
reset_pattern = r"    setError\(null\);\n  \};"
c = re.sub(reset_pattern, "    setError(null);\n    setIsDataLinked(false);\n  };", c)

# Update handleGstinChange to link data
handle_pattern = r"  const handleGstinChange = \(val: string\) => \{\n    const gstin = val\.trim\(\)\.slice\(0, 15\);\n    let pan = formData\.gstProfile\?\.pan \|\| '';\n    if \(gstin\.length >= 12\) pan = gstin\.substring\(2, 12\);\n    setFormData\(prev => \(\{\n      \.\.\.prev,\n      gstProfile: \{ \.\.\.prev\.gstProfile!, gstin, pan \}\n    \}\)\);\n  \};"
handle_repl = """  const handleGstinChange = (val: string) => {
    const gstin = val.trim().slice(0, 15);
    let pan = formData.gstProfile?.pan || '';
    if (gstin.length >= 12) {
      pan = gstin.substring(2, 12);
    }
    
    setFormData(prev => ({
      ...prev,
      gstProfile: { ...prev.gstProfile!, gstin, pan }
    }));

    if (!initialData && pan.length === 10) {
      const match = existingClients.find(c => 
         (c.itProfile?.pan === pan || c.gstProfile?.pan === pan || c.gstProfile?.gstin?.substring(2, 12) === pan)
      );
      if (match) {
        setFormData(prev => ({
          ...match,
          ...prev,
          id: match.id,
          legalName: match.legalName || prev.legalName,
          tradeName: match.tradeName || prev.tradeName,
          mobile: match.mobile || prev.mobile,
          email: match.email || prev.email,
          bankDetails: match.bankDetails || prev.bankDetails,
          remarks: match.remarks || prev.remarks,
          gstProfile: {
            ...match.gstProfile,
            ...prev.gstProfile,
            gstin,
            pan
          }
        }));
        setIsDataLinked(true);
      } else {
        setIsDataLinked(false);
      }
    }
  };"""

c = c.replace(re.search(handle_pattern, c).group(0), handle_repl)

# Update save logic to check duplicate GSTIN
save_pattern = r"  const handleSave = async \(\) => \{\n    setError\(null\);\n    const profile = formData\.gstProfile!;\n    const gstinRegex = /^[0-9]\{2\}[A-Z]\{5\}[0-9]\{4\}[A-Z]\{1\}[1-9A-Z]\{1\}Z[0-9A-Z]\{1\}$/;"
save_repl = """  const handleSave = async () => {
    setError(null);
    const profile = formData.gstProfile!;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    const isDuplicate = existingClients.some(c => 
      c.gstProfile?.gstin === profile.gstin && c.id !== initialData?.id
    );
    if (isDuplicate) return setError(`GSTIN ${profile.gstin} is already archived.`);
"""

c = re.sub(save_pattern, save_repl, c)

with open('pages/Clientform/GSTClientFormModal.tsx', 'w') as f:
    f.write(c)
print('Patched GST form')
