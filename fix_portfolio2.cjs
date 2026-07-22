const fs = require('fs');
let c = fs.readFileSync('pages/ClientHub/GstMasterPortfolio.tsx', 'utf8');

const groupedClientsStr = `  const groupedClients = useMemo(() => {
    const groups: Record<string, typeof filteredClients> = {};
    filteredClients.forEach(c => {
      const sector = c.gstProfile?.sector || 'Uncategorized';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(c);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
       if (a === 'Uncategorized') return 1;
       if (b === 'Uncategorized') return -1;
       return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    return sortedKeys.map(k => ({ sector: k, clients: groups[k].sort((c1, c2) => (c1.tradeName || '').localeCompare(c2.tradeName || '')) }));
  }, [filteredClients]);`;

// Remove it from its current position
c = c.replace(groupedClientsStr, '');

// Insert it after filteredClients useMemo
const filteredClientsEndStr = `      const matchesStatus = statusFilter === 'All' || c.gstProfile?.gstStatus === statusFilter;
      const matchesMonth = filingMonthFilter === 'All' || c.gstProfile?.regDate?.includes(filingMonthFilter);
      return matchesSearch && matchesStatus && matchesMonth;
    });
    return list;
  }, [clients, externalSearch, statusFilter, filingMonthFilter]);`;

c = c.replace(filteredClientsEndStr, filteredClientsEndStr + '\n\n' + groupedClientsStr);

fs.writeFileSync('pages/ClientHub/GstMasterPortfolio.tsx', c);
console.log('Fixed GstMasterPortfolio');
