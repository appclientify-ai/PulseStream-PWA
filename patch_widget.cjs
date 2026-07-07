const fs = require('fs');
const file = 'components/UpcomingDeadlinesWidget.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldList = `<div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
        {deadlines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[10px] font-black uppercase tracking-widest">No upcoming deadlines</p>
          </div>
        ) : (
          deadlines.slice(0, 6).map(d => {
            const diffTime = d.date.getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isUrgent = diffDays <= 3 && diffDays >= 0;

            return (
              <div key={d.key} className={\`p-4 rounded-2xl border \${isUrgent ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'} flex items-center justify-between group transition-all\`}>
                <div>
                  <p className={\`text-[11px] font-black uppercase tracking-widest \${isUrgent ? 'text-red-600' : 'text-slate-900'} mb-1\`}>
                    {moduleNames[d.moduleId] || d.moduleId}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {d.period} • {d.year}
                  </p>
                </div>
                <div className="text-right">
                  <p className={\`text-sm font-black \${isUrgent ? 'text-red-600' : 'text-indigo-600'}\`}>
                    {d.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className={\`text-[9px] font-black uppercase tracking-widest mt-0.5 \${isUrgent ? 'text-red-400' : 'text-slate-400'}\`}>
                    {diffDays === 0 ? 'Today' : \`In \${diffDays} Days\`}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {deadlines.length > 6 && (
         <div className="pt-4 mt-2 border-t border-slate-100 text-center shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+{deadlines.length - 6} More Upcoming</p>
         </div>
      )}`;

const newList = `<div className="flex-1 overflow-y-auto no-scrollbar">
        {deadlines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[10px] font-black uppercase tracking-widest">No upcoming deadlines</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
          {deadlines.slice(0, 10).map(d => {
            const diffTime = d.date.getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isUrgent = diffDays <= 3 && diffDays >= 0;

            return (
              <div key={d.key} className={\`p-4 rounded-2xl border \${isUrgent ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'} flex items-center justify-between group transition-all\`}>
                <div>
                  <p className={\`text-[11px] font-black uppercase tracking-widest \${isUrgent ? 'text-red-600' : 'text-slate-900'} mb-1\`}>
                    {moduleNames[d.moduleId] || d.moduleId}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {d.period} • {d.year}
                  </p>
                </div>
                <div className="text-right">
                  <p className={\`text-sm font-black \${isUrgent ? 'text-red-600' : 'text-indigo-600'}\`}>
                    {d.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className={\`text-[9px] font-black uppercase tracking-widest mt-0.5 \${isUrgent ? 'text-red-400' : 'text-slate-400'}\`}>
                    {diffDays === 0 ? 'Today' : \`In \${diffDays} Days\`}
                  </p>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
      
      {deadlines.length > 10 && (
         <div className="pt-4 mt-2 border-t border-slate-100 text-center shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+{deadlines.length - 10} More Upcoming</p>
         </div>
      )}`;

if (content.includes(oldList)) {
  content = content.replace(oldList, newList);
  fs.writeFileSync(file, content);
  console.log("Patched widget");
} else {
  console.log("oldList not found in widget");
}
