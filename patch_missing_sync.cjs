const fs = require('fs');

const patchFile = (filePath, fetchFuncName, isLoadData) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('clientify_db_change')) return;
  
  let patchCode;
  if (isLoadData) {
    patchCode = `
    const syncHandler = () => ${fetchFuncName}();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
`;
  } else {
    patchCode = `
    const syncHandler = () => ${fetchFuncName}();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
`;
  }

  // We find the first useEffect that calls the fetchFuncName, and insert before its return or at the end
  const useEffectMatch = content.match(/useEffect\(\(\) => \{([\s\S]*?)\}, \[/);
  if (useEffectMatch && useEffectMatch[1].includes(fetchFuncName)) {
    const originalBody = useEffectMatch[1];
    
    // We just append to the body before the last bracket
    // Wait, simpler way: replace `useEffect(() => { ... }, []);`
    
    // Let's just do a string replace on a known pattern
    if (originalBody.includes('return () =>')) {
       // Too complex if there's already a return
       // We can just add another useEffect!
       const extraEffect = `\n  useEffect(() => {\n    const syncHandler = () => ${fetchFuncName}();\n    window.addEventListener('clientify_db_change', syncHandler);\n    return () => window.removeEventListener('clientify_db_change', syncHandler);\n  }, []);\n`;
       content = content.replace("  const filteredClients = ", extraEffect + "  const filteredClients = ");
       content = content.replace("  const stats = ", extraEffect + "  const stats = ");
    } else {
       const extraEffect = `\n  useEffect(() => {\n    const syncHandler = () => ${fetchFuncName}();\n    window.addEventListener('clientify_db_change', syncHandler);\n    return () => window.removeEventListener('clientify_db_change', syncHandler);\n  }, [${isLoadData ? 'loadData' : ''}]);\n`;
       
       if (content.includes("  const filteredClients = ")) {
          content = content.replace("  const filteredClients = ", extraEffect + "  const filteredClients = ");
       } else if (content.includes("  const stats = ")) {
          content = content.replace("  const stats = ", extraEffect + "  const stats = ");
       } else if (content.includes("  const handle")) {
          content = content.replace("  const handle", extraEffect + "  const handle");
       } else {
          content = content.replace("  return (", extraEffect + "  return (");
       }
    }
    fs.writeFileSync(filePath, content);
    console.log('Patched', filePath);
  }
}

patchFile('pages/ClientHub/ITPortfolio.tsx', 'loadData', true);
patchFile('pages/Compliance/AnnualReturns/GSTR4.tsx', 'fetchClients', false);
patchFile('pages/Administration/Messenger.tsx', "() => api.getClients().then(setClients)", false);

