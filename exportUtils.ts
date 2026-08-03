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

import { formatDate } from './dateUtils';
import { Client } from './types';

export interface ClientColorTheme {
  type: 'cancelled' | 'suspended' | 'inactive' | 'litigation' | 'active';
  rowClass: string;
  tradeNameClass: string;
  legalNameClass: string;
  gstinClass: string;
  gstStatusBadgeClass: string;
  clientStatusBadgeClass: string;
}

export const getClientColorTheme = (c: Client): ClientColorTheme => {
  const gstStatus = c?.gstProfile?.gstStatus;
  const clientStatus = c?.status;

  // 1. Cancelled / Closed Registration -> RED
  if (gstStatus === 'Closed' || gstStatus === 'Cancelled') {
    return {
      type: 'cancelled',
      rowClass: 'bg-red-50/70 hover:bg-red-100/80 border-l-4 border-l-red-500',
      tradeNameClass: 'text-red-700 font-black',
      legalNameClass: 'text-red-600 font-bold',
      gstinClass: 'text-red-700 font-mono font-bold',
      gstStatusBadgeClass: 'bg-red-100 text-red-700 border border-red-300 font-black',
      clientStatusBadgeClass: 'bg-red-100 text-red-700 border border-red-300 font-black',
    };
  }

  // 2. Suspended Registration -> YELLOW / AMBER
  if (gstStatus === 'Suspended') {
    return {
      type: 'suspended',
      rowClass: 'bg-amber-50/70 hover:bg-amber-100/80 border-l-4 border-l-amber-500',
      tradeNameClass: 'text-amber-800 font-black',
      legalNameClass: 'text-amber-700 font-bold',
      gstinClass: 'text-amber-800 font-mono font-bold',
      gstStatusBadgeClass: 'bg-amber-100 text-amber-800 border border-amber-300 font-black',
      clientStatusBadgeClass: 'bg-amber-100 text-amber-800 border border-amber-300 font-black',
    };
  }

  // 3. Client Status = Inactive -> ORANGE
  if (clientStatus === 'Inactive') {
    return {
      type: 'inactive',
      rowClass: 'bg-orange-50/70 hover:bg-orange-100/80 border-l-4 border-l-orange-500',
      tradeNameClass: 'text-orange-800 font-black',
      legalNameClass: 'text-orange-700 font-bold',
      gstinClass: 'text-orange-800 font-mono font-bold',
      gstStatusBadgeClass: 'bg-orange-100 text-orange-800 border border-orange-300 font-black',
      clientStatusBadgeClass: 'bg-orange-100 text-orange-800 border border-orange-300 font-black',
    };
  }

  // 4. Client Status = Litigation -> PURPLE
  if (clientStatus === 'Litigation') {
    return {
      type: 'litigation',
      rowClass: 'bg-purple-50/70 hover:bg-purple-100/80 border-l-4 border-l-purple-500',
      tradeNameClass: 'text-purple-800 font-black',
      legalNameClass: 'text-purple-700 font-bold',
      gstinClass: 'text-purple-800 font-mono font-bold',
      gstStatusBadgeClass: 'bg-purple-100 text-purple-800 border border-purple-300 font-black',
      clientStatusBadgeClass: 'bg-purple-100 text-purple-800 border border-purple-300 font-black',
    };
  }

  // 5. Default Active Client
  return {
    type: 'active',
    rowClass: 'hover:bg-indigo-50/20',
    tradeNameClass: 'text-slate-900 font-black',
    legalNameClass: 'text-slate-600 font-bold',
    gstinClass: 'text-indigo-600 font-mono font-bold',
    gstStatusBadgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100 font-black',
    clientStatusBadgeClass: 'bg-indigo-50 text-indigo-600 border border-indigo-100 font-black',
  };
};

export const getSectorGroupLabel = (c: any): string => {
  if (!c || !c.gstProfile) return 'Uncategorized';
  
  const rawSector = (c.gstProfile.sector || c.gstProfile.range || '').trim();
  const baseSector = rawSector || 'Uncategorized';

  let jur = c.gstProfile.jurisdictionType;
  if (!jur) {
    jur = c.gstProfile.range && !c.gstProfile.sector ? 'Center' : 'State';
  }

  const jurLabel = jur === 'Center' ? 'Center' : 'State';

  const lower = baseSector.toLowerCase();
  if (lower.includes('(state)') || lower.includes('(center)')) {
    return baseSector;
  }
  if (lower.endsWith(' state') || lower.endsWith(' center')) {
    return `${baseSector} (${jurLabel})`;
  }

  return `${baseSector} (${jurLabel})`;
};

export { formatDate };
