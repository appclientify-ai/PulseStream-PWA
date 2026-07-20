require('@babel/register')({
  presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
  extensions: ['.js', '.jsx', '.ts', '.tsx']
});
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');

// Provide mocked globals
global.window = { addEventListener: () => {}, removeEventListener: () => {}, location: { href: '' } };
global.document = { addEventListener: () => {}, removeEventListener: () => {} };
global.navigator = { clipboard: { writeText: () => Promise.resolve() } };

try {
  const MonthlyFiling = require('./pages/Compliance/GSTReturn/MonthlyFiling.tsx').default;
  const html = ReactDOMServer.renderToString(
    React.createElement(MemoryRouter, null, React.createElement(MonthlyFiling))
  );
  console.log("Rendered successfully length:", html.length);
} catch (e) {
  console.error("Error rendering MonthlyFiling:", e);
}
