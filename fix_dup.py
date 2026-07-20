import re
with open('pages/Clientform/ITClientFormModal.tsx', 'r') as f:
    c = f.read()

old_dup = r"    const isDuplicate = existingClients\.some\(c => \n      c\.itProfile\?\.pan === profile\.pan && c\.id !== formData\.id\n    \);\n    if \(isDuplicate\) return setError\(`PAN \$\{profile\.pan\} is already archived in IT records\.`\);"

new_dup = """    if (!initialData && existingClients.some(c => c.itProfile?.pan === profile.pan)) {
      return setError(`PAN ${profile.pan} is already archived in IT records.`);
    }
    if (initialData && existingClients.some(c => c.itProfile?.pan === profile.pan && c.id !== formData.id)) {
      return setError(`PAN ${profile.pan} is already archived in IT records.`);
    }"""

c = re.sub(old_dup, new_dup, c)
with open('pages/Clientform/ITClientFormModal.tsx', 'w') as f:
    f.write(c)

with open('pages/Clientform/GSTClientFormModal.tsx', 'r') as f:
    c2 = f.read()

old_dup2 = r"    const isDuplicate = existingClients\.some\(c => \n      c\.gstProfile\?\.gstin === profile\.gstin && c\.id !== formData\.id\n    \);\n    if \(isDuplicate\) return setError\(`GSTIN \$\{profile\.gstin\} is already archived\.`\);"

new_dup2 = """    if (!initialData && existingClients.some(c => c.gstProfile?.gstin === profile.gstin)) {
      return setError(`GSTIN ${profile.gstin} is already archived.`);
    }
    if (initialData && existingClients.some(c => c.gstProfile?.gstin === profile.gstin && c.id !== formData.id)) {
      return setError(`GSTIN ${profile.gstin} is already archived.`);
    }"""

c2 = re.sub(old_dup2, new_dup2, c2)
with open('pages/Clientform/GSTClientFormModal.tsx', 'w') as f:
    f.write(c2)
print("Fixed duplicate logic")
