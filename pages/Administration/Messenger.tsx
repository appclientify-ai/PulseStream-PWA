
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types';
import { api } from '../../services/api.ts';
import Loader from '../../components/Loader';
import { toast } from 'sonner';


const DEFAULT_TEMPLATES = [
  { id: 'data', label: 'Data Request', text: "Dear {{LEGAL_NAME}},\n\nPlease provide purchase/sale data for {{TRADE_NAME}} ({{GSTIN}}) for current filing.\n\nRegards,\nVault Team" },
  { id: 'done', label: 'Filing Done', text: "Dear {{LEGAL_NAME}},\n\nYour GST return for {{TRADE_NAME}} ({{GSTIN}}) has been filed successfully.\n\nRegards,\nVault Team" },
];

const Messenger: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templateText, setTemplateText] = useState('');
  const [search, setSearch] = useState('');
  const [userTemplates, setUserTemplates] = useState<{label: string, text: string}[]>(() => {
    const saved = localStorage.getItem('clientify_custom_templates');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isQueueActive, setIsQueueActive] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  useEffect(() => {
    api.getClients().then(data => {
      setClients(data);
      setIsLoading(false);
    });
  }, []);


  useEffect(() => {
    const syncHandler = () => api.getClients().then(setClients);
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);
  const filteredClients = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter(c => 
      c.legalName.toLowerCase().includes(s) || 
      c.tradeName.toLowerCase().includes(s) ||
      (c.gstProfile?.gstin && c.gstProfile.gstin.toLowerCase().includes(s))
    );
  }, [clients, search]);

  const selectedClientsList = useMemo(() => clients.filter(c => selectedIds.has(c.id)), [clients, selectedIds]);

  const toggleAll = () => {
    if (selectedIds.size === filteredClients.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredClients.map(c => c.id)));
  };

  const toggleClient = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const formatMessage = (rawText: string, client: Client) => {
    let text = rawText;
    text = text.replace(/{{LEGAL_NAME}}/g, client.legalName || "---");
    text = text.replace(/{{TRADE_NAME}}/g, client.tradeName || "---");
    text = text.replace(/{{GSTIN}}/g, client.gstProfile?.gstin || "N/A");
    return text;
  };

  const saveCurrentTemplate = () => {
    if (!templateText.trim()) return;
    const label = prompt("Enter template name:");
    if (label) {
      const next = [...userTemplates, { label, text: templateText }];
      setUserTemplates(next);
      localStorage.setItem('clientify_custom_templates', JSON.stringify(next));
    }
  };

  const deleteTemplate = (idx: number) => {
    const next = userTemplates.filter((_, i) => i !== idx);
    setUserTemplates(next);
    localStorage.setItem('clientify_custom_templates', JSON.stringify(next));
  };

  const startBroadcast = () => {
    if (selectedIds.size === 0) return;
    setQueueIndex(0);
    setIsQueueActive(true);
    setIsComposerOpen(false);
  };

  const processNext = () => {
    const client = selectedClientsList[queueIndex];
    if (!client) return;
    const personalizedMsg = formatMessage(templateText, client);
    const url = `whatsapp://send?phone=91${client.mobile}&text=${encodeURIComponent(personalizedMsg)}`;
    window.location.href = url;
    if (queueIndex < selectedClientsList.length - 1) setQueueIndex(queueIndex + 1);
    else {
      toast.success("Broadcast Sequence Completed!");
      setIsQueueActive(false);
      setSelectedIds(new Set());
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 max-w-full mx-auto w-full overflow-hidden">
      
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-6 px-4 border-r border-slate-100 hidden md:flex shrink-0">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
            <p className="text-xl font-black text-slate-900 leading-none">{clients.length}</p>
          </div>
          <div className="text-center border-l border-slate-100 pl-6">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Selected</p>
            <p className="text-xl font-black text-indigo-600 leading-none">{selectedIds.size}</p>
          </div>
        </div>

        <div className="relative flex-1 group w-full">
          <input type="text" placeholder="Search targets..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600/10 outline-none transition-all" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex gap-2 shrink-0">
          <button onClick={toggleAll} className="px-6 h-11 border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 transition-all">
            {selectedIds.size === filteredClients.length ? 'Deselect All' : 'Select All'}
          </button>
          <button disabled={selectedIds.size === 0} onClick={() => setIsComposerOpen(true)}
            className="bg-indigo-600 text-white font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg hover:bg-slate-900 transition-all text-xs flex items-center gap-2 disabled:opacity-30">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            Composer ({selectedIds.size})
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar flex-1">
          <table className="w-full text-left border-collapse table-auto overflow-hidden min-w-full">
            <thead className=" sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Sel.</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">S.No.</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Trade Name</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Legal Name</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">GSTIN</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Mobile No.</th>
                <th className=" px-4 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((c, idx) => (
                <tr key={c.id} onClick={() => toggleClient(c.id)} className={`cursor-pointer transition-all group ${selectedIds.has(c.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}>
                  <td className=" px-4 py-5 text-center">
                    <div className={`h-5 w-5 mx-auto rounded-md border-2 transition-all flex items-center justify-center ${selectedIds.has(c.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 bg-white group-hover:border-indigo-400'}`}>
                      {selectedIds.has(c.id) && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </td>
                  <td className=" px-4 py-5 text-[11px] font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                  <td className=" px-4 py-5 text-[12px] font-black truncate text-slate-900" title={c.tradeName}>{c.tradeName || '---'}</td>
                  <td className=" px-4 py-5 text-[11px] font-bold text-slate-400 truncate" title={c.legalName}>{c.legalName}</td>
                  <td className=" px-4 py-5 font-black text-slate-600 font-mono text-[11px] uppercase tracking-widest">{c.gstProfile?.gstin || 'N/A'}</td>
                  <td className=" px-4 py-5 font-black text-slate-600 text-[12px]">+91 {c.mobile}</td>
                  <td className="px-4 py-5 text-right ">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${c.status.includes('Active') ? 'text-green-500' : 'text-slate-300'}`}>
                      {c.status.includes('Active') ? 'Active' : 'Inact.'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isComposerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 flex flex-col gap-1">
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                 <div><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Compose Broadcast</h3><p className="text-slate-500 text-sm font-medium mt-1">Routing to {selectedIds.size} entities.</p></div>
                 <button onClick={() => setIsComposerOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100"><svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                 <section>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Firm Templates</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {DEFAULT_TEMPLATES.map(t => <button key={t.id} onClick={() => setTemplateText(t.text)} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all border border-slate-100">{t.label}</button>)}
                       {userTemplates.map((t, i) => (
                         <div key={i} className="flex items-center bg-indigo-50 rounded-xl border border-indigo-100">
                           <button onClick={() => setTemplateText(t.text)} className="px-4 py-2 text-indigo-600 text-[10px] font-black uppercase">{t.label}</button>
                           <button onClick={() => deleteTemplate(i)} className="pr-3 text-indigo-300 hover:text-red-500 transition-colors"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg></button>
                         </div>
                       ))}
                    </div>
                 </section>
                 <section className="flex-1 flex flex-col">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-4">Message Body</label>
                    <textarea value={templateText} onChange={e => setTemplateText(e.target.value)} placeholder="Use placeholders: {{LEGAL_NAME}}, {{TRADE_NAME}}, {{GSTIN}}"
                      className="w-full flex-1 min-h-[250px] bg-slate-50 border border-slate-200 rounded-[2rem] p-8 font-bold text-lg text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none" />
                 </section>
              </div>
              <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <button onClick={saveCurrentTemplate} className="text-indigo-600 font-black uppercase text-[10px] hover:underline">Save as template</button>
                 <button onClick={startBroadcast} disabled={!templateText.trim()} className="bg-indigo-600 text-white font-black uppercase tracking-[0.2em] px-12 h-16 rounded-2xl shadow-xl hover:bg-slate-900 transition-all disabled:opacity-30">Start Sequence</button>
              </div>
           </div>
        </div>
      )}

      {isQueueActive && selectedClientsList[queueIndex] && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col gap-1">
              <div className="bg-slate-900 p-8 text-white">
                 <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Messaging Hub</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{queueIndex + 1} / {selectedClientsList.length}</span>
                 </div>
                 <h3 className="text-xl font-black truncate">{selectedClientsList[queueIndex].legalName}</h3>
                 <div className="mt-8 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((queueIndex + 1) / selectedClientsList.length) * 100}%` }} />
                 </div>
              </div>
              <div className="p-10 space-y-6">
                 <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                    <div className="text-slate-700 font-bold whitespace-pre-wrap leading-relaxed text-sm">{formatMessage(templateText, selectedClientsList[queueIndex])}</div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setIsQueueActive(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-[10px] hover:text-red-500">Abort</button>
                    <button onClick={processNext} className="flex-[2] bg-emerald-600 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      {queueIndex === selectedClientsList.length - 1 ? 'Final Send' : 'Send & Next'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Messenger;
