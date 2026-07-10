const fs = require('fs');
const file = 'services/api.ts';
let content = fs.readFileSync(file, 'utf8');

const oldFunc = `  async generateNextInvoiceNo(): Promise<string> {
    const invs = await this.getInvoices();
    const sets = await this.getInvoiceSettings();
    let maxCount = 0;
    for (const inv of invs) {
       const parts = inv.invoiceNo.split('/');
       if (parts.length > 1) {
          const numStr = parts[parts.length - 1];
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxCount) {
             maxCount = num;
          }
       }
    }
    const count = maxCount + 1;
    const year = new Date().getFullYear();
    return \`\${sets.invoicePrefix}\${year}/\${count.toString().padStart(3, '0')}\`;
  }`;

const newFunc = `  async generateNextInvoiceNo(): Promise<string> {
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

content = content.replace(oldFunc, newFunc);
fs.writeFileSync(file, content);
console.log("Patched api.ts generateNextInvoiceNo");
