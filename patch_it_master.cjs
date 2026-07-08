const fs = require('fs');
const file = 'pages/ClientHub/ItMasterPortfolio.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add table headers
const oldHeaders = `<th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Mobile No.</th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Pan No.</th>`;
              
const newHeaders = `<th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Mobile No.</th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Email ID</th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Address</th>
              <th className=" px-[5.5px] py-3 text-[14px] font-bold uppercase tracking-widest text-slate-900">Pan No.</th>`;

content = content.replace(oldHeaders, newHeaders);

// Add empty columns for No records
content = content.replace('colSpan={8}', 'colSpan={10}');

// Add table data
const oldData = `<td className=" px-[5.5px] py-[2px]">
                     <p className="font-black text-slate-500 text-[12px]">{client.mobile || '---'}</p>
                  </td>
                  <td className=" px-[5.5px] py-[2px]">
                     <div className="flex items-center gap-2 group/pan">`;

const newData = `<td className=" px-[5.5px] py-[2px]">
                     <p className="font-black text-slate-500 text-[12px]">{client.mobile || '---'}</p>
                  </td>
                  <td className=" px-[5.5px] py-[2px] max-w-[150px]">
                     <p className="font-bold text-slate-600 text-[11px] truncate" title={client.email}>{client.email || '---'}</p>
                  </td>
                  <td className=" px-[5.5px] py-[2px] max-w-[150px]">
                     <p className="font-bold text-slate-600 text-[11px] truncate" title={client.address}>{client.address || '---'}</p>
                  </td>
                  <td className=" px-[5.5px] py-[2px]">
                     <div className="flex items-center gap-2 group/pan">`;

content = content.replace(oldData, newData);

fs.writeFileSync(file, content);
console.log("Patched ItMasterPortfolio.tsx");
