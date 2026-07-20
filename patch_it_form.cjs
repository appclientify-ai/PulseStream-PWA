const fs = require('fs');
let c = fs.readFileSync('pages/Clientform/ITClientFormModal.tsx', 'utf8');

const regex = /      if \(match\) \{\n        setFormData\(prev => \(\{\n          \.\.\.prev,\n          legalName: match\.legalName \|\| prev\.legalName,\n          tradeName: match\.tradeName \|\| prev\.tradeName,\n          mobile: match\.mobile \|\| prev\.mobile,\n          email: match\.email \|\| prev\.email,\n          bankDetails: match\.bankDetails \|\| prev\.bankDetails,\n          remarks: match\.remarks \|\| prev\.remarks\n        \}\)\);\n        setIsDataLinked\(true\);\n      \}/g;

const replacement = `      if (match) {
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
          itProfile: {
            ...match.itProfile,
            ...prev.itProfile
          }
        }));
        setIsDataLinked(true);
      }`;

if (c.match(regex)) {
  c = c.replace(regex, replacement);
  fs.writeFileSync('pages/Clientform/ITClientFormModal.tsx', c);
  console.log('Patched IT form');
} else {
  console.log('Regex failed');
}
