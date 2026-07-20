require('@babel/register')({
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  extensions: ['.ts', '.tsx', '.js', '.jsx']
});

const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Mock browser APIs
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: '' }
};
global.document = {
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.navigator = { clipboard: { writeText: async () => {} } };

const MonthlyFiling = require('./pages/Compliance/GSTReturn/MonthlyFiling.tsx').default;

try {
  const html = ReactDOMServer.renderToString(React.createElement(MonthlyFiling));
  console.log("Rendered successfully!", html.substring(0, 100));
} catch (e) {
  console.error("RENDER ERROR:", e);
}
