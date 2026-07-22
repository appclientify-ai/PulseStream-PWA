const fs = require('fs');

const files = [
  'pages/LitigationSuite/GSTAppeals/AppealDemand.tsx',
  'pages/LitigationSuite/GSTAppeals/AppealDrop.tsx',
  'pages/LitigationSuite/GSTAppeals/AppealFiled.tsx',
  'pages/LitigationSuite/GSTAppeals/AppealPending.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeDemand.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeDrop.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeFiled.tsx',
  'pages/LitigationSuite/GSTNotices/NoticePending.tsx',
  'pages/LitigationSuite/HighCourt/CourtDemand.tsx',
  'pages/LitigationSuite/HighCourt/CourtDrop.tsx',
  'pages/LitigationSuite/HighCourt/CourtFiled.tsx',
  'pages/LitigationSuite/HighCourt/CourtPending.tsx',
  'pages/LitigationSuite/Tribunal/TribunalDemand.tsx',
  'pages/LitigationSuite/Tribunal/TribunalDrop.tsx',
  'pages/LitigationSuite/Tribunal/TribunalFiled.tsx',
  'pages/LitigationSuite/Tribunal/TribunalPending.tsx'
];

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  
  c = c.replace(/className="w-full max-w-2xl bg-white rounded-\[2\.5rem\] shadow-2xl flex flex-col animate-in zoom-in-95 overflow-hidden"/g, 
    'className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl flex flex-col animate-in zoom-in-95 max-h-[90vh] overflow-hidden"');
  
  c = c.replace(/className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between"/g, 
    'className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0"');
  c = c.replace(/className="p-10 grid grid-cols-2 gap-8"/g, 
    'className="p-6 grid grid-cols-2 gap-4 overflow-y-auto"');
  c = c.replace(/className="p-8 border-t border-slate-100 flex justify-end gap-3 shrink-0"/g, 
    'className="p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0"');
    
  fs.writeFileSync(file, c);
}
console.log('Fixed more modals');
