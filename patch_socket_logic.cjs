const fs = require('fs');
let c = fs.readFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', 'utf8');

if (!c.includes('socketService')) {
  c = c.replace("import { api } from '../../../../services/api.ts';", "import { api } from '../../../../services/api.ts';\nimport { socketService } from '../../../../services/socket.ts';");
  
  const loadDataStr = `  useEffect(() => {\n    const loadData = async () => {\n      try {\n        const data = await api.getAppData(storageKey);\n        setAllData(data || {});\n        setIsDataLoaded(true);\n      } catch (err) {\n        console.error('Failed to load filing data', err);\n      }\n    };\n    loadData();\n  }, [storageKey]);`;
  
  const newLoadDataStr = `  const loadData = useCallback(async () => {\n    try {\n      const data = await api.getAppData(storageKey);\n      setAllData(data || {});\n      setIsDataLoaded(true);\n    } catch (err) {\n      console.error('Failed to load filing data', err);\n    }\n  }, [storageKey]);\n\n  useEffect(() => {\n    loadData();\n    socketService.on('sync_data', loadData);\n    return () => {\n      socketService.off('sync_data', loadData);\n    };\n  }, [loadData]);`;
  
  c = c.replace(loadDataStr, newLoadDataStr);
  fs.writeFileSync('pages/Compliance/GSTReturn/filinglogic/MonthlyFilingLogic.tsx', c);
}
