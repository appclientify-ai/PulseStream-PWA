const fs = require('fs');

const fixPasswordColumn = (filepath) => {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');

    // CompositionFiling.tsx
    content = content.replace(
        /<span>••••••••<\/span>/g,
        `<span className="font-black text-indigo-400 text-[12px] truncate">{client.gstProfile?.password}</span>`
    );

    // GSTR9_9C.tsx and GSTR4.tsx
    content = content.replace(
        /<span className="font-black (text-\[12px\] )?text-indigo-400 tracking-wider truncate">\{isPassVisible \? client\.gstProfile\?\.password : '••••••••'\}<\/span>[\s\S]*?<button onClick=\{.*?isPassVisible \? '🙈' : '👁️'.*?<\/button>/,
        `<span className="font-black text-indigo-400 tracking-wider text-[12px] truncate">{client.gstProfile?.password}</span>`
    );

    fs.writeFileSync(filepath, content, 'utf8');
};

['pages/Compliance/GSTReturn/CompositionFiling.tsx', 'pages/Compliance/AnnualReturns/GSTR4.tsx', 'pages/Compliance/AnnualReturns/GSTR9_9C.tsx'].forEach(fixPasswordColumn);

console.log("Passwords fixed.");
