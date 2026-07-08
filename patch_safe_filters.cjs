const fs = require('fs');

function patchFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Fix sort
  content = content.replace(/\.sort\(\(a, b\) => new Date\(b\.([a-zA-Z]+)\)\.getTime\(\) - new Date\(a\.\1\)\.getTime\(\)\)/g, 
    ".sort((a, b) => (new Date(b.$1 || 0).getTime() || 0) - (new Date(a.$1 || 0).getTime() || 0))");

  // Fix r.mobile.includes
  content = content.replace(/\(r\.mobile && r\.mobile\.includes\(s\)\)/g, 
    "(r.mobile && String(r.mobile).includes(s))");

  // Fix r.arn.toLowerCase().includes
  content = content.replace(/\(r\.arn && r\.arn\.toLowerCase\(\)\.includes\(s\)\)/g, 
    "(r.arn && String(r.arn).toLowerCase().includes(s))");

  // Fix r.licenseNo.toLowerCase().includes
  content = content.replace(/\(r\.licenseNo && r\.licenseNo\.toLowerCase\(\)\.includes\(s\)\)/g, 
    "(r.licenseNo && String(r.licenseNo).toLowerCase().includes(s))");

  // Fix r.udyamNo.toLowerCase().includes
  content = content.replace(/\(r\.udyamNo && r\.udyamNo\.toLowerCase\(\)\.includes\(s\)\)/g, 
    "(r.udyamNo && String(r.udyamNo).toLowerCase().includes(s))");
    
  // Fix r.description.toLowerCase().includes
  content = content.replace(/\(r\.description \|\| ''\)\.toLowerCase\(\)\.includes\(s\)/g, 
    "(String(r.description || '')).toLowerCase().includes(s)");

  // Fix r.assignedTo.toLowerCase().includes
  content = content.replace(/\(r\.assignedTo \|\| ''\)\.toLowerCase\(\)\.includes\(s\)/g, 
    "(String(r.assignedTo || '')).toLowerCase().includes(s)");

  fs.writeFileSync(file, content);
  console.log("Patched " + file);
}

patchFile('pages/Miscellaneous/GSTRegistration.tsx');
patchFile('pages/Miscellaneous/FoodLicenses.tsx');
patchFile('pages/Miscellaneous/MSMERegistration.tsx');
patchFile('pages/Miscellaneous/Miscellaneouswork.tsx');
