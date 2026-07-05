const fs = require('fs');
const file = 'components/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('usePWA')) {
    content = content.replace(
        /import \{ useAuth \} from '\.\.\/auth\/AuthContext';/,
        `import { useAuth } from '../auth/AuthContext';\nimport { usePWA } from '../hooks/usePWA';`
    );

    content = content.replace(
        /const \{ logout \} = useAuth\(\);/,
        `const { logout } = useAuth();\n  const { canInstall, triggerInstall } = usePWA();`
    );

    content = content.replace(
        /<div className="hidden lg:flex items-center gap-3 rounded-full bg-slate-50 px-4 py-2 border border-slate-100">/,
        `{canInstall && (
          <button onClick={triggerInstall} className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-md shadow-indigo-600/20">
             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             App
          </button>
        )}
        <div className="hidden lg:flex items-center gap-3 rounded-full bg-slate-50 px-4 py-2 border border-slate-100">`
    );
    
    // Add mobile install to profile dropdown as well, or just show it for mobile headers
    content = content.replace(
        /<div className="flex items-center gap-3 md:gap-6 shrink-0">/,
        `<div className="flex items-center gap-3 md:gap-6 shrink-0">
        {canInstall && (
          <button onClick={triggerInstall} className="sm:hidden flex items-center justify-center h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-md shadow-indigo-600/20" title="Install App">
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
        )}`
    );

    fs.writeFileSync(file, content);
    console.log('Patched Header with PWA install button');
} else {
    console.log('usePWA already in Header');
}
