const fs = require('fs');

let content = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

content = content.replace(/label="GSTR-04 Annual"[\s\S]*?subLabel=\{`FY \$\{monthlyFilter\.year\}`\}/.exec(content)[0], `label="GSTR-04 Annual" 
                          periodControls={
                               <select 
                                  className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                  value={annualFilter.year}
                                  onChange={(e) => setAnnualFilter({ ...annualFilter, year: e.target.value })}
                               >
                                 {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                               </select>
                          }`);

content = content.replace(/label="GSTR-9\/9C Audit"[\s\S]*?subLabel=\{`FY \$\{monthlyFilter\.year\}`\}/.exec(content)[0], `label="GSTR-9/9C Audit" 
                          periodControls={
                               <select 
                                  className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                  value={annualFilter.year}
                                  onChange={(e) => setAnnualFilter({ ...annualFilter, year: e.target.value })}
                               >
                                 {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                               </select>
                          }`);

content = content.replace(/label="ITR Returns"[\s\S]*?subLabel=\{`AY \$\{itrFilter\.ay\}`\}/.exec(content)[0], `label="ITR Returns" 
                          periodControls={
                               <div className="flex gap-1 items-center">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">AY</span>
                                 <select 
                                    className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                    value={itrFilter.ay}
                                    onChange={(e) => setItrFilter({ ...itrFilter, ay: e.target.value })}
                                 >
                                   {YEARS.map(y => {
                                      const startYear = parseInt(y.split('-')[0]);
                                      const ay = \`\${startYear + 1}-\${(startYear + 2).toString().slice(-2)}\`;
                                      return <option key={ay} value={ay}>{ay}</option>;
                                   })}
                                 </select>
                               </div>
                          }`);

content = content.replace(/label="Audit & B\/S"[\s\S]*?subLabel=\{`AY \$\{itrFilter\.ay\}`\}/.exec(content)[0], `label="Audit & B/S" 
                          periodControls={
                               <div className="flex gap-1 items-center">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">AY</span>
                                 <select 
                                    className="bg-transparent border-none text-[10px] uppercase font-bold text-slate-400 cursor-pointer focus:ring-0 p-0"
                                    value={itrFilter.ay}
                                    onChange={(e) => setItrFilter({ ...itrFilter, ay: e.target.value })}
                                 >
                                   {YEARS.map(y => {
                                      const startYear = parseInt(y.split('-')[0]);
                                      const ay = \`\${startYear + 1}-\${(startYear + 2).toString().slice(-2)}\`;
                                      return <option key={ay} value={ay}>{ay}</option>;
                                   })}
                                 </select>
                               </div>
                          }`);

// Ensure getFilingCounts uses annualFilter for gstr4 and gstr9!
content = content.replace(/const gstr4Stats = getFilingCounts\('gstr4', \`\$\{monthlyFilter\.year\}\`\);/, "const gstr4Stats = getFilingCounts('gstr4', `${annualFilter.year}`);");
content = content.replace(/const gstr9Stats = getFilingCounts\('gstr9', \`\$\{monthlyFilter\.year\}\`\);/, "const gstr9Stats = getFilingCounts('gstr9', `${annualFilter.year}`);");

fs.writeFileSync('pages/Primary/Dashboard.tsx', content, 'utf8');
console.log('Update successful');
