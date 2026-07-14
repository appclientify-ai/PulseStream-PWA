const fs = require('fs');
let content = fs.readFileSync('pages/Compliance/AnnualReturns/GSTR4.tsx', 'utf8');

const updated = `
  useEffect(() => { 
    fetchClients(); 
    api.getAppData('clientify_composition_filing_v3').then(data => {
      if (data) setCmp08Data(data);
    }).catch(console.error);
  }, []);
`;

const startIndex = content.indexOf(`  useEffect(() => { \n    fetchClients();`);
const endIndex = content.indexOf(`  useEffect(() => {`, startIndex + 20);

if (startIndex > -1 && endIndex > -1) {
  content = content.substring(0, startIndex) + updated.trim() + '\n\n' + content.substring(endIndex);
  fs.writeFileSync('pages/Compliance/AnnualReturns/GSTR4.tsx', content);
} else {
  console.log('Could not find block');
}
