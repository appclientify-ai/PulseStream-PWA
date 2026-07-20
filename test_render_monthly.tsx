// Mock browser APIs
(global as any).window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { host: 'localhost:3000', hostname: 'localhost' }
};
(global as any).document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  head: { appendChild: () => {} },
  getElementsByTagName: () => [{ appendChild: () => {} }],
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {} }),
  createTextNode: () => ({})
};
Object.defineProperty(global, 'navigator', { value: { clipboard: { writeText: async () => {} } } });

async function run() {
  const React = await import('react');
  const ReactDOMServer = await import('react-dom/server');
  const MonthlyFiling = (await import('./pages/Compliance/GSTReturn/MonthlyFiling.tsx')).default;
  const QuarterlyFiling = (await import('./pages/Compliance/GSTReturn/QuarterlyFiling.tsx')).default;

  try {
    const html = ReactDOMServer.renderToString(React.createElement(MonthlyFiling));
    console.log("MonthlyFiling Rendered successfully!");
    const html2 = ReactDOMServer.renderToString(React.createElement(QuarterlyFiling));
    console.log("QuarterlyFiling Rendered successfully!");
  } catch (e) {
    console.error("RENDER ERROR:", e);
  }
}
run();
