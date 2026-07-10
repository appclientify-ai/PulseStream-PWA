const fs = require('fs');
const file = 'pages/Administration/invoice/Invoices.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldHandlePrint = `  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('about:blank', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(\`
        <html><head><title>Invoice - \${previewInvoice?.invoiceNo}</title><script src="https://cdn.tailwindcss.com"></script></head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
          <div class="p-10">\${printContent.innerHTML}</div>
        </body></html>
      \`);
      printWindow.document.close();
    }
  };`;

const newHandlePrint = `  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('about:blank', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(\`
        <html>
        <head>
          <title>Invoice - \${previewInvoice?.invoiceNo}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              .page-break { page-break-before: always; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 800)">
          <div class="p-4 sm:p-10 max-w-5xl mx-auto">\${printContent.innerHTML}</div>
        </body>
        </html>
      \`);
      printWindow.document.close();
    }
  };`;

content = content.replace(oldHandlePrint, newHandlePrint);

fs.writeFileSync(file, content);
console.log("Patched handlePrint in Invoices.tsx");
