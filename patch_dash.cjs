const fs = require('fs');
let c = fs.readFileSync('pages/Primary/Dashboard.tsx', 'utf8');

c = `import { ErrorBoundary } from '../../components/ErrorBoundary.tsx';\n` + c;

c = c.replace(
  /\{isInitialLoad \? <Loader \/> : <Suspense fallback=\{<Loader \/>\}>\{renderContent\(\)\}<\/Suspense>\}/g,
  `{isInitialLoad ? <Loader /> : <ErrorBoundary><Suspense fallback={<Loader />}>{renderContent()}</Suspense></ErrorBoundary>}`
);

fs.writeFileSync('pages/Primary/Dashboard.tsx', c);
