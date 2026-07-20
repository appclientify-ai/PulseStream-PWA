const fs = require('fs');
let c = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

const replacement = `      const syncHandler = (e: any) => { 
        console.log('Real-time sync event received:', e.detail);
        if (!e || !e.detail || !e.detail.data) {
          loadData(true);
          return;
        }
        
        const payload = e.detail;
        const { type, data } = payload;
        const id = data._id || payload.id;
        
        // Format to match API responses
        const item = { ...data.data, id: id, createdAt: data.createdAt, updatedAt: data.updatedAt };
        
        const applyUpdate = (setter: any) => {
          setter((prev: any[]) => {
            if (type === 'insert') return [item, ...prev];
            if (type === 'update') return prev.map(p => (p.id === id ? { ...p, ...item } : p));
            if (type === 'delete') return prev.filter(p => p.id !== id);
            return prev;
          });
        };

        switch (data.name) {
          case 'client': applyUpdate(setClients); break;
          case 'invoice': applyUpdate(setInvoices); break;
          case 'litigation': applyUpdate(setLitigation); break;
          case 'work': applyUpdate(setMiscWork); break;
          case 'gstReg': applyUpdate(setGstReg); break;
          case 'foodLic': applyUpdate(setFoodLic); break;
          case 'msme': applyUpdate(setMsme); break;
          case 'payment': applyUpdate(setPayments); break;
          default: 
            console.log('Unknown slice, reloading all data');
            loadData(true);
        }
      };`;

c = c.replace(/const syncHandler = \(\) => \{ console\.log\('Syncing main dashboard data\.\.\.'\); loadData\(true\); \};/g, replacement);

fs.writeFileSync('pages/Primary/Dashboard.tsx', c);
