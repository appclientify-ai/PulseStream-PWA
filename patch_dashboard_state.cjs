const fs = require('fs');
const file = 'pages/Primary/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const [miscWork, setMiscWork] = useState<any[]>([]);",
  "const [miscWork, setMiscWork] = useState<any[]>([]);\n  const [gstReg, setGstReg] = useState<any[]>([]);\n  const [foodLic, setFoodLic] = useState<any[]>([]);\n  const [msme, setMsme] = useState<any[]>([]);"
);

content = content.replace(
  "setMiscWork(summary.work);",
  "setMiscWork(summary.work);\n      setGstReg(summary.gstReg || []);\n      setFoodLic(summary.foodLic || []);\n      setMsme(summary.msme || []);"
);

content = content.replace(
  "<CompactCard label=\"GST Reg.\" count={(clients || []).filter(c => c && c.status === 'Active').length} viewId=\"misc-gst-reg\"",
  "<CompactCard label=\"GST Reg.\" count={gstReg.length} viewId=\"misc-gst-reg\""
);

content = content.replace(
  "<CompactCard label=\"Food License\" count={0} viewId=\"misc-food-lic\"",
  "<CompactCard label=\"Food License\" count={foodLic.length} viewId=\"misc-food-lic\""
);

content = content.replace(
  "<CompactCard label=\"MSME Reg.\" count={0} viewId=\"misc-msme\"",
  "<CompactCard label=\"MSME Reg.\" count={msme.length} viewId=\"misc-msme\""
);

fs.writeFileSync(file, content);
console.log("Patched dashboard state");
