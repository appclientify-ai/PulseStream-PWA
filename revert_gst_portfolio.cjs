const fs = require('fs');

const file = 'pages/ClientHub/GstMasterPortfolio.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove getComplianceStatus function
content = content.replace(/const getComplianceStatus = \(client: Client\) => {[\s\S]*?};\n/, '');

// Remove Compliance header
content = content.replace(/<th className=" px-\[5\.5px\] py-3 text-\[14px\] font-bold uppercase tracking-widest text-slate-900">Compliance<\/th>\n\s*/, '');

// Remove Compliance cell
const cellRegex = /<td className=" px-\[5\.5px\] py-\[2px\]">\s*\{\(\(\) => \{\s*const compStat = getComplianceStatus\(client\);\s*return compStat \? \([\s\S]*?\)\s*:\s*\([\s\S]*?\);\s*\}\)\(\)\}\s*<\/td>\n\s*/;
content = content.replace(cellRegex, '');

// Restore colSpan
content = content.replace(/colSpan=\{9\}/g, 'colSpan={8}');

fs.writeFileSync(file, content);
console.log("Reverted GST");
