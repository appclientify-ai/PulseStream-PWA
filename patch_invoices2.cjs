const fs = require('fs');
const file = 'pages/Administration/invoice/Invoices.tsx';
let content = fs.readFileSync(file, 'utf8');

// Filter out Paid invoices from All
content = content.replace(
  "    let list = invoices.filter(i => \n      i.invoiceNo.toLowerCase().includes(s) || \n      i.clientName.toLowerCase().includes(s)\n    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());",
  `    let list = invoices.filter(i => 
      (i.status !== 'Paid') && 
      (i.invoiceNo.toLowerCase().includes(s) || 
      i.clientName.toLowerCase().includes(s))
    ).sort((a,b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));`
);

// Remove 'Paid' from the TableFilter options
content = content.replace(
  "{['All', 'Draft', 'Sent', 'Paid'].map(st => (",
  "{['All', 'Draft', 'Sent'].map(st => ("
);

fs.writeFileSync(file, content);
console.log("Patched Invoices.tsx for Paid filter");
