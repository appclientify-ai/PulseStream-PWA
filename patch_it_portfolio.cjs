const fs = require('fs');

const file = 'pages/ClientHub/ItMasterPortfolio.tsx';
let content = fs.readFileSync(file, 'utf8');

const helper = `
const getComplianceStatus = (client: Client) => {
   if (!client || !client.itProfile) return null;
   
   if (client.status === 'Inactive') {
      return { label: 'N/A', color: 'bg-slate-50 text-slate-400 border-slate-200' };
   }
   
   const getCurrentAY = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    return \`\${startYear}-\${(startYear + 1).toString().slice(-2)}\`;
   };

   const ay = getCurrentAY();

   const hasAudit = client.itProfile?.advisoryWork?.taxAudit;
   
   if (hasAudit) {
      const data = JSON.parse(localStorage.getItem('clientify_audit_fin_data_v3') || '{}');
      const pData = data[ay] || {};
      const status = pData[client.id] || {};
      return status.auditFiled ? { label: 'Filed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' } : { label: 'Pending', color: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' };
   }
   
   const data = JSON.parse(localStorage.getItem('clientify_itr_filing_data_v2') || '{}');
   const pData = data[ay] || {};
   const status = pData[client.id] || {};
   return status.filed ? { label: 'Filed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' } : { label: 'Pending', color: 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' };
};
`;

if (!content.includes('getComplianceStatus')) {
  content = content.replace('const ItMasterPortfolio: React.FC', helper + '\nconst ItMasterPortfolio: React.FC');
}

const headerMatch = `<th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900 text-right">Action</th>`;
const newHeader = `<th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Compliance</th>\n              ` + headerMatch;
if (!content.includes('<th>Compliance</th>') && !content.includes('>Compliance<')) {
  content = content.replace(headerMatch, newHeader);
}

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

content = content.replace(/colSpan=\{8\}/g, 'colSpan={9}');

fs.writeFileSync(file, content);
console.log("Patched IT");
