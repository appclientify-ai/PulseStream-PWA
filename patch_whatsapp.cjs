const fs = require('fs');

const filesToPatch = [
    'pages/Compliance/ITAudit/ITRReturn.tsx',
    'pages/Compliance/AnnualReturns/GSTR9_9C.tsx',
    'pages/Compliance/AnnualReturns/GSTR4.tsx',
    'pages/ClientHub/GstMasterPortfolio.tsx',
    'pages/ClientHub/ItMasterPortfolio.tsx'
];

for (const file of filesToPatch) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(
            /window\.open\(\`https:\/\/api\.whatsapp\.com\/send\?text=\$\{encodeURIComponent\(text\)\}\`, '_blank'\);/g,
            "window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;"
        );
        fs.writeFileSync(file, content);
        console.log('Patched', file);
    }
}

const gstFilingFiles = [
    'pages/Compliance/GSTReturn/QuarterlyFiling.tsx',
    'pages/Compliance/GSTReturn/CompositionFiling.tsx',
    'pages/Compliance/GSTReturn/MonthlyFiling.tsx'
];

for (const file of gstFilingFiles) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(
            /window\.open\(\`https:\/\/wa\.me\/\?text=\$\{encodeURIComponent\(text\)\}\`, '_blank'\);/g,
            "window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;"
        );
        fs.writeFileSync(file, content);
        console.log('Patched', file);
    }
}

const messengerFile = 'pages/Administration/Messenger.tsx';
if (fs.existsSync(messengerFile)) {
    let content = fs.readFileSync(messengerFile, 'utf8');
    content = content.replace(
        /const url = \`https:\/\/api\.whatsapp\.com\/send\?phone=91\$\{client\.mobile\}&text=\$\{encodeURIComponent\(personalizedMsg\)\}\`;/g,
        "const url = `whatsapp://send?phone=91${client.mobile}&text=${encodeURIComponent(personalizedMsg)}`;"
    );
    // Messenger uses window.open(url, '_blank') later? Let's check.
    fs.writeFileSync(messengerFile, content);
    console.log('Patched', messengerFile);
}

const invoicesFile = 'pages/Administration/invoice/Invoices.tsx';
if (fs.existsSync(invoicesFile)) {
    let content = fs.readFileSync(invoicesFile, 'utf8');
    content = content.replace(
        /window\.open\(\`https:\/\/api\.whatsapp\.com\/send\?phone=\$\{previewInvoice\.miscMobile \|\| ''\}&text=\$\{encodeURIComponent\(text\)\}\`, '_blank'\);/g,
        "window.location.href = `whatsapp://send?phone=${previewInvoice.miscMobile || ''}&text=${encodeURIComponent(text)}`;"
    );
    fs.writeFileSync(invoicesFile, content);
    console.log('Patched', invoicesFile);
}

