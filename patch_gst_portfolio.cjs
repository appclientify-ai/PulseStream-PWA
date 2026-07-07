const fs = require('fs');

const file = 'pages/ClientHub/GstMasterPortfolio.tsx';
let content = fs.readFileSync(file, 'utf8');

const helper = `
const getComplianceStatus = (client: Client) => {
   if (!client || !client.gstProfile) return null;
   
   const freq = client.gstProfile.filingFreq;
   const isComp = client.gstProfile.regType === 'Composition';
   
   const now = new Date();
   const m = now.getMonth();
   const calYear = now.getFullYear();
   const getFY = (month: number, year: number) => {
     if (month >= 3) return \`\${year}-\${(year + 1).toString().slice(-2)}\`;
     return \`\${year - 1}-\${year.toString().slice(-2)}\`;
   };
   
   let prevMonthIdx = m - 1;
   let mYear = calYear;
   if (prevMonthIdx < 0) { prevMonthIdx = 11; mYear = calYear - 1; }
   const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][prevMonthIdx];
   const monthFY = getFY(prevMonthIdx, mYear);
   
   let qIdx;
   let prevQMonth;
   let prevQYear = calYear;
   if (m >= 0 && m <= 2) { qIdx = 2; prevQMonth = 9; prevQYear = calYear - 1; } 
   else if (m >= 3 && m <= 5) { qIdx = 3; prevQMonth = 0; } 
   else if (m >= 6 && m <= 8) { qIdx = 0; prevQMonth = 3; } 
   else { qIdx = 1; prevQMonth = 6; }
   const quarters = ['April-June (Q1)', 'July-September (Q2)', 'October-December (Q3)', 'January-March (Q4)'];
   const quarterName = quarters[qIdx];
   const quarterFY = getFY(prevQMonth, prevQYear);

   if (client.gstProfile.gstStatus === 'Closed') {
      return { label: 'N/A', color: 'bg-slate-50 text-slate-400 border-slate-200' };
   }

   if (isComp) {
      const data = JSON.parse(localStorage.getItem('clientify_composition_filing_v3') || '{}');
      const pData = data[\`\${quarterFY}_\${quarterName}\`] || {};
      const status = pData[client.id] || {};
      return status.cmp08 ? { label: 'Filed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' } : { label: 'Pending', color: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' };
   }
   
   if (freq === 'Quarterly') {
      const data = JSON.parse(localStorage.getItem('clientify_quarterly_filing_v3') || '{}');
      const pData = data[\`\${quarterFY}_\${quarterName}\`] || {};
      const status = pData[client.id] || {};
      return status.r3b ? { label: 'Filed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' } : { label: 'Pending', color: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' };
   }
   
   const data = JSON.parse(localStorage.getItem('clientify_monthly_filing_v3') || '{}');
   const pData = data[\`\${monthFY}_\${monthName}\`] || {};
   const status = pData[client.id] || {};
   return status.r3b ? { label: 'Filed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' } : { label: 'Pending', color: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' };
};
`;

// Insert helper right before component definition
if (!content.includes('getComplianceStatus')) {
  content = content.replace('const GstMasterPortfolio: React.FC', helper + '\nconst GstMasterPortfolio: React.FC');
}

// Add the column header
const headerMatch = `<th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 text-right">Actions</th>`;
const newHeader = `<th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Compliance</th>\n              ` + headerMatch;
if (!content.includes('<th>Compliance</th>') && !content.includes('>Compliance<')) {
  content = content.replace(headerMatch, newHeader);
}

// Add the column cell
const cellMatch = `<td className=" px-[5.5px] py-[2px] text-right overflow-visible">`;
const newCell = `<td className=" px-[5.5px] py-[2px]">
                     {(() => {
                        const compStat = getComplianceStatus(client);
                        return compStat ? (
                          <span className={\`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border \${compStat.color}\`}>
                            {compStat.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">---</span>
                        );
                     })()}
                  </td>\n                  ` + cellMatch;
if (!content.includes('getComplianceStatus(client)')) {
  content = content.replace(cellMatch, newCell);
}

// Ensure Colspan is updated for empty state
content = content.replace(/colSpan=\{8\}/g, 'colSpan={9}');

fs.writeFileSync(file, content);
console.log("Patched GST");
