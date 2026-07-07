export const exportToCSV = (headers: string[], rows: any[][], filename: string) => {
  const csvContent = 
    headers.join(',') + '\n' +
    rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printList = (title: string, headers: string[], rows: any[][]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f8f9fa; }
          h2 { margin-top: 0; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(r => `<tr>${r.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <script>
          window.onload = () => { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};

export const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '---';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    // Looks like YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // Try to parse as date object
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  return dateStr;
};
