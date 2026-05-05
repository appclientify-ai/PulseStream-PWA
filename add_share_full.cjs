const fs = require('fs');

const files = [
  'pages/Compliance/GSTReturn/MonthlyFiling.tsx',
  'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
  'pages/Compliance/GSTReturn/CompositionFiling.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  const targetRegex = /<button onClick=\{\(\) => \{\s*const text = `Trade Name: \$\{selectedClient.tradeName \|\| \'\'\}\\nLegal Name: \$\{selectedClient.legalName \|\| \'\'\}\\nGSTIN: \$\{selectedClient.gstProfile\?\.gstin \|\| \'\'\}\\nUser ID: \$\{selectedClient.gstProfile\?\.username \|\| \'\'\}\\nPassword: \$\{selectedClient.gstProfile\?\.password \|\| \'\'\}`;\s*window.open\(`https:\/\/wa.me\/\?text=\$\{encodeURIComponent\(text\)\}`, '_blank'\);\s*setActiveActionsId\(null\);\s*\}\} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group border-t border-slate-100">[\s\S]+?<\/button>/s;
  
  const replacement = `           <button onClick={() => { 
             const text = \`Trade Name: \${selectedClient.tradeName || ''}\\nLegal Name: \${selectedClient.legalName || ''}\\nGSTIN: \${selectedClient.gstProfile?.gstin || ''}\\nUser ID: \${selectedClient.gstProfile?.username || ''}\\nPassword: \${selectedClient.gstProfile?.password || ''}\`;
             window.open(\`https://wa.me/?text=\${encodeURIComponent(text)}\`, '_blank');
             setActiveActionsId(null); 
           }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group border-t border-slate-100">
              <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.549 4.2 1.593 6.035L.302 23.687l5.772-1.517a12.001 12.001 0 005.957 1.57h.005c6.645 0 12.031-5.385 12.031-12.031C24.067 5.385 18.681 0 12.031 0zm0 21.724c-1.802 0-3.568-.485-5.114-1.403l-.367-.217-3.8.998 1.018-3.705-.238-.38A9.992 9.992 0 012.016 12.03c0-5.526 4.498-10.024 10.024-10.024 2.678 0 5.195 1.042 7.087 2.937 1.892 1.892 2.934 4.409 2.934 7.087 0 5.528-4.499 10.028-10.025 10.028v-.004c0-.001-.002-.001-.005-.001zM17.53 14.19c-.302-.15-1.785-.882-2.062-.983-.277-.101-.479-.151-.68.15s-.781.983-.956 1.185c-.176.201-.352.226-.653.076-.301-.15-1.275-.471-2.428-1.5-3.036-2.699-2.227-2.699-.582-5.467.243-.404-.76-2.222-1.04-2.912-.272-.676-.55-.584-.755-.595l-.645-.01c-.226 0-.594.084-.904.42-.311.336-1.191 1.163-1.191 2.836 0 1.674 1.221 3.292 1.391 3.519.17.227 2.457 3.864 5.952 5.253.81.321 1.442.513 1.934.656.812.235 1.551.202 2.138.122.656-.09 2.062-.843 2.353-1.657.292-.814.292-1.512.204-1.657-.087-.145-.313-.231-.615-.383z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">WhatsApp Creds</span>
           </button>
           <button onClick={() => { 
             const fullText = \`*Client Details*\\nTrade Name: \${selectedClient.tradeName || ''}\\nLegal Name: \${selectedClient.legalName || ''}\\nMobile: \${selectedClient.mobile || ''}\\nEmail: \${selectedClient.email || ''}\\n\\n*GST Details*\\nGSTIN: \${selectedClient.gstProfile?.gstin || ''}\\nUser ID: \${selectedClient.gstProfile?.username || ''}\\nPassword: \${selectedClient.gstProfile?.password || ''}\\n\\n*IT Details*\\nPAN: \${selectedClient.itProfile?.pan || ''}\\nIT User ID: \${selectedClient.itProfile?.username || ''}\\nIT Password: \${selectedClient.itProfile?.password || ''}\`;
             window.open(\`https://wa.me/?text=\${encodeURIComponent(fullText)}\`, '_blank');
             setActiveActionsId(null); 
           }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group border-t border-slate-100">
              <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-white shadow-sm"><svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.549 4.2 1.593 6.035L.302 23.687l5.772-1.517a12.001 12.001 0 005.957 1.57h.005c6.645 0 12.031-5.385 12.031-12.031C24.067 5.385 18.681 0 12.031 0zm0 21.724c-1.802 0-3.568-.485-5.114-1.403l-.367-.217-3.8.998 1.018-3.705-.238-.38A9.992 9.992 0 012.016 12.03c0-5.526 4.498-10.024 10.024-10.024 2.678 0 5.195 1.042 7.087 2.937 1.892 1.892 2.934 4.409 2.934 7.087 0 5.528-4.499 10.028-10.025 10.028v-.004c0-.001-.002-.001-.005-.001zM17.53 14.19c-.302-.15-1.785-.882-2.062-.983-.277-.101-.479-.151-.68.15s-.781.983-.956 1.185c-.176.201-.352.226-.653.076-.301-.15-1.275-.471-2.428-1.5-3.036-2.699-2.227-2.699-.582-5.467.243-.404-.76-2.222-1.04-2.912-.272-.676-.55-.584-.755-.595l-.645-.01c-.226 0-.594.084-.904.42-.311.336-1.191 1.163-1.191 2.836 0 1.674 1.221 3.292 1.391 3.519.17.227 2.457 3.864 5.952 5.253.81.321 1.442.513 1.934.656.812.235 1.551.202 2.138.122.656-.09 2.062-.843 2.353-1.657.292-.814.292-1.512.204-1.657-.087-.145-.313-.231-.615-.383z"/></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">WhatsApp Full Info</span>
           </button>`;

  content = content.replace(targetRegex, replacement.trim());
  fs.writeFileSync(file, content, 'utf8');
});

console.log("Updated files");
