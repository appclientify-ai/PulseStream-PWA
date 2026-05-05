const fs = require('fs');

const files = [
  'pages/LitigationSuite/GSTAppeals/AppealDrop.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeDrop.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeFiled.tsx',
  'pages/LitigationSuite/GSTNotices/NoticePending.tsx',
  'pages/LitigationSuite/GSTNotices/NoticeDemand.tsx',
  'pages/Clientform/GSTClientFormModal.tsx',
  'pages/Compliance/GSTReturn/CompositionFiling.tsx',
  'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
  'pages/Compliance/GSTReturn/MonthlyFiling.tsx',
  'pages/Compliance/AnnualReturns/GSTR4.tsx',
  'pages/Compliance/AnnualReturns/GSTR9_9C.tsx',
  'pages/ClientHub/GstMasterPortfolio.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes("import { toast }") && content.includes("services.gst.gov.in/services/searchtp")) {
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfImportIdx = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfImportIdx + 1) + "import { toast } from 'sonner';\n" + content.slice(endOfImportIdx + 1);
  }

  // Find window.open(`https://services.gst.gov.in/services/searchtp?gstin=${some_var}`, '_blank')
  content = content.replace(
    /window\.open\(`https:\/\/services\.gst\.gov\.in\/services\/searchtp\?gstin=\$\{([^}]+)\}`, '_blank'\)/g,
    "(navigator.clipboard.writeText($1 || '').then(() => { toast.success('GSTIN Copied!'); window.open('https://services.gst.gov.in/services/searchtp', '_blank'); }))"
  );
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log("Updated files");
