const fs = require('fs');
const file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `<div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
              <div className="col-span-1 xl:col-span-2">
                {/* Attention Summary Card */}
                <section className="h-full">
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 h-full">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-red-600/5 -mr-10 -mt-10 rounded-full blur-3xl" />
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Requires Attention</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Litigation Matters</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                     <div className="text-center px-4 border-r border-slate-100">
                        <p className="text-3xl font-black text-slate-900">{pendingNotices}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Notices</p>
                     </div>
                     <div className="text-center px-4 border-r border-slate-100">
                        <p className="text-3xl font-black text-slate-900">{pendingAppeals}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Appeals</p>
                     </div>
                     <div className="text-center px-4 border-r border-slate-100">
                        <p className="text-3xl font-black text-slate-900">{pendingTribunals}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Tribunal</p>
                     </div>
                     <div className="text-center px-4">
                        <p className="text-3xl font-black text-slate-900">{pendingCourt}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">High Court</p>
                     </div>
                                       
                  </div>
                  </div>
               </section>
              </div>
              <div className="col-span-1 min-h-[400px]">
                 <UpcomingDeadlinesWidget />
              </div>
            </div>`;

const newStr = `<div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
              <div className="col-span-1 xl:col-span-2 min-h-[400px]">
                 <UpcomingDeadlinesWidget />
              </div>
              <div className="col-span-1">
                {/* Attention Summary Card */}
                <section className="h-full">
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden flex flex-col justify-center gap-6 h-full">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-red-600/5 -mr-10 -mt-10 rounded-full blur-3xl" />
                  <div className="flex items-center gap-6 relative z-10">
                     <div className="h-14 w-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner shrink-0">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Requires Attention</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Litigation</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 relative z-10 w-full">
                     <div className="text-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                        <p className="text-2xl font-black text-slate-900">{pendingNotices}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Notices</p>
                     </div>
                     <div className="text-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                        <p className="text-2xl font-black text-slate-900">{pendingAppeals}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Appeals</p>
                     </div>
                     <div className="text-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                        <p className="text-2xl font-black text-slate-900">{pendingTribunals}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Tribunal</p>
                     </div>
                     <div className="text-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                        <p className="text-2xl font-black text-slate-900">{pendingCourt}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">High Court</p>
                     </div>
                  </div>
                  </div>
               </section>
              </div>
            </div>`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
  console.log("Success replace");
} else {
  // Let's use regex
  content = content.replace(/<div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">[\s\S]*?<\/div>\s*<\/div>\n\s*\{\/\* Sector 1: Client Hub \*\/\}/, newStr + '\n            {/* Sector 1: Client Hub */}');
  fs.writeFileSync(file, content);
  console.log("Success regex replace");
}
