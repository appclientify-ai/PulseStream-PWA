const fs = require('fs');
const file = 'pages/Administration/invoice/Invoices.tsx';
let content = fs.readFileSync(file, 'utf8');

const settlingModal = `
      {/* Settling Modal */}
      {settlingInvoice && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col p-8 space-y-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Record Payment</h3>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Payment Date</label>
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50"
                  value={payDate} onChange={e => setPayDate(e.target.value)} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Payment Mode</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none focus:ring-4 focus:ring-emerald-50"
                  value={payMode} onChange={e => setPayMode(e.target.value as any)}>
                  <option value="Online">Online / NEFT</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {payMode === 'Cheque' && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Cheque / Reference No</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold outline-none uppercase focus:ring-4 focus:ring-emerald-50"
                    value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="000000" />
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSettlingInvoice(null)} className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                <button type="button" onClick={handleReceiveConfirm} className="flex-[2] bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98]">Confirm Payment</button>
              </div>
           </div>
        </div>
      )}
`;

content = content.replace('{/* Invoice Preview Modal */}', settlingModal + '\n      {/* Invoice Preview Modal */}');

fs.writeFileSync(file, content);
console.log("Patched Invoices.tsx for settling modal");
