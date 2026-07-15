const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

if (!content.includes("import { socketService }")) {
  content = content.replace("import { Toaster } from 'sonner';", "import { Toaster } from 'sonner';\nimport { socketService } from './services/socket.ts';");
}

if (!content.includes("socketService.connect()")) {
  const useEffectAuth = `  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated]);`;
  
  content = content.replace("  const navigate = useNavigate();", "  const navigate = useNavigate();\n" + useEffectAuth);
}

fs.writeFileSync('App.tsx', content);
