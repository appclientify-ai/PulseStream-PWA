const fs = require('fs');
let file = 'pages/ClientHub/ITPortfolio.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/clients\.filter\(c => c\.status/g, 'clients.filter(c => c?.status');
  content = content.replace(/\(clients \|\| \[\]\)\.filter\(c => c\.status/g, '(clients || []).filter(c => c?.status');
  content = content.replace(/clients\.map\(c => /g, '(clients || []).filter(Boolean).map(c => ');
  content = content.replace(/setClients\(\(data \|\| \[\]\)\.filter\(c => !!c\.itProfile\)\)/g, "setClients((data || []).filter(c => c && c.itProfile))");
  fs.writeFileSync(file, content);
}

const file2 = 'pages/ClientHub/ItMasterPortfolio.tsx';
if (fs.existsSync(file2)) {
  let content = fs.readFileSync(file2, 'utf8');
  content = content.replace(/list\.filter\(c => c\.status/g, 'list.filter(c => c?.status');
  content = content.replace(/list\.filter\(c => \(/g, 'list.filter(c => c && (');
  // ensure we don't break existing line
  fs.writeFileSync(file2, content);
}

const file3 = 'pages/ClientHub/GstMasterPortfolio.tsx';
if (fs.existsSync(file3)) {
  let content = fs.readFileSync(file3, 'utf8');
  content = content.replace(/list\.filter\(c => c\.status/g, 'list.filter(c => c?.status');
  content = content.replace(/list\.filter\(c => \(c\.gstProfile/g, 'list.filter(c => c && (c.gstProfile');
  fs.writeFileSync(file3, content);
}

console.log("Fixed falsy c in IT & GST Master");
