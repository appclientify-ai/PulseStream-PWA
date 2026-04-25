const fs = require('fs');

const passBlock = `<td className="whitespace-nowrap px-4 py-[2px] font-black text-indigo-400 tracking-widest relative group/pass">
                      <div className="flex items-center gap-2">
                        <span>
                          {isEditingPass ? (
                            <input autoFocus value={newPassVal} onChange={e => setNewPassVal(e.target.value)} onBlur={handleUpdatePassword} onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()} className="bg-white border border-indigo-200 rounded px-2 h-7 text-[11px] font-black w-24 outline-none" />
                          ) : (
                            <div className="flex items-center gap-2">
                               <span className="font-black text-indigo-400 text-[12px] truncate">{client.gstProfile?.password}</span>
                               <button onClick={() => { setSelectedClient(client); setEditingPasswordId(client.id); setNewPassVal(client.gstProfile?.password || ''); }} className="p-1 text-slate-300 hover:text-amber-500 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                               {client.gstProfile?.username && (
                                 <button onClick={() => { 
                                   navigator.clipboard.writeText(client.gstProfile?.username || ''); 
                                   window.open('https://services.gst.gov.in/services/login', '_blank'); 
                                 }} className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover/pass:opacity-100 transition-all shrink-0" title="Login to GST Portal">
                                   <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                 </button>
                               )}
                            </div>
                          )}
                        </span>
                      </div>
                    </td>`;

const processFile = (file) => {
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('editingPasswordId')) {
        content = content.replace(
            /(const \[isDetailModalOpen,.*\n)/,
            `$1  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');\n`
        );
    }
    if (file.includes('GSTR4.tsx') && !content.includes('editingPasswordId')) {
        content = content.replace(/(const \[search,.*\n)/, 
        `$1  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');\n`);
    }

    if (file.includes('CompositionFiling.tsx') && !content.includes('editingPasswordId')) {
        content = content.replace(/(const \[search,.*\n)/, 
        `$1  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPassVal, setNewPassVal] = useState('');\n`);
    }

    if (!content.includes('handleUpdatePassword')) {
        let fn = `
  const handleUpdatePassword = async () => {
    if (!selectedClient || !newPassVal.trim()) return;
    try {
      const updated = { ...selectedClient, gstProfile: { ...selectedClient.gstProfile!, password: newPassVal } };
      await api.saveClient(updated);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? (updated as any) : c));
      setEditingPasswordId(null);
    } catch (err) { toast.error("Update failed."); }
  };
`;
        if (file.includes('GSTR9_9C')) fn = fn.replace('setClients', 'setAllClients');
        content = content.replace(/((\/\/ Handlers|const handleExport|const shareViaWhatsApp)[^\n]*\n)/, fn + '$1');
    }

    if (!content.includes('isEditingPass = editingPasswordId')) {
        content = content.replace(/return \(\s*<tr key=\{client\.id\}/g, `const isEditingPass = editingPasswordId === client.id;
                return (
                  <tr key={client.id}`);
    }

    if (file.includes('CompositionFiling')) {
        content = content.replace(/<td className="whitespace-nowrap px-4 py-\[2px\] font-black text-indigo-400 tracking-widest">[\s\S]*?<\/td>/, passBlock);
    } else if (file.includes('GSTR4.tsx') || file.includes('GSTR9_9C.tsx')) {
        content = content.replace(/const \[visiblePasswords,.*\n/g, '');
        content = content.replace(/const isPassVisible = .*\n/g, '');
        content = content.replace(/<td className="whitespace-nowrap px-4 py-\[2px\] font-black text-indigo-400 tracking-widest relative group\/pass">[\s\S]*?<\/div>[\s]*<\/td>/, passBlock);
    }

    fs.writeFileSync(file, content, 'utf8');
}

['pages/Compliance/GSTReturn/CompositionFiling.tsx', 'pages/Compliance/AnnualReturns/GSTR4.tsx', 'pages/Compliance/AnnualReturns/GSTR9_9C.tsx'].forEach(processFile);
console.log("Passwords fixed universally");
