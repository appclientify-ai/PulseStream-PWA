const fs = require('fs');
const file = 'services/api.ts';
let content = fs.readFileSync(file, 'utf8');

const getFyFunc = `
const getFinancialYear = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  if (month >= 3) {
    return \`\${year.toString().slice(2)}-\${(year + 1).toString().slice(2)}\`;
  } else {
    return \`\${(year - 1).toString().slice(2)}-\${year.toString().slice(2)}\`;
  }
};
`;

// Insert the helper at the top
if (!content.includes('getFinancialYear')) {
  content = content.replace("import { db } from '../db/db';", "import { db } from '../db/db';\n" + getFyFunc);
}

const oldGen = `  async generateNextInvoiceNo(): Promise<string> {
    const invs = await this.getInvoices();
    const sets = await this.getInvoiceSettings();
    const existingNums = new Set<number>();
    for (const inv of invs) {
       const parts = inv.invoiceNo.split('/');
       if (parts.length > 1) {
          const numStr = parts[parts.length - 1];
          const num = parseInt(numStr, 10);
          if (!isNaN(num)) {
             existingNums.add(num);
          }
       }
    }
    let count = 1;
    while (existingNums.has(count)) {
       count++;
    }
    const year = new Date().getFullYear();
    return \`\${sets.invoicePrefix}\${year}/\${count.toString().padStart(3, '0')}\`;
  }`;

const newGen = `  async generateNextInvoiceNo(): Promise<string> {
    const invs = await this.getInvoices();
    const sets = await this.getInvoiceSettings();
    const fy = getFinancialYear();
    const prefix = sets.invoicePrefix || 'INV';
    
    // Filter invoices by the same financial year to find the next number
    const sameFyInvs = invs.filter(inv => inv.invoiceNo.includes(\`\${prefix}/\${fy}/\`));
    
    const existingNums = new Set<number>();
    for (const inv of sameFyInvs) {
       const parts = inv.invoiceNo.split('/');
       if (parts.length >= 3) {
          const numStr = parts[parts.length - 1];
          const num = parseInt(numStr, 10);
          if (!isNaN(num)) {
             existingNums.add(num);
          }
       }
    }
    
    let count = 1;
    while (existingNums.has(count)) {
       count++;
    }
    return \`\${prefix}/\${fy}/\${count.toString().padStart(2, '0')}\`;
  }`;

if (content.includes(oldGen)) {
  content = content.replace(oldGen, newGen);
  fs.writeFileSync(file, content);
  console.log("Patched api.ts generation logic.");
} else {
  console.log("Could not find old generateNextInvoiceNo logic.");
}
