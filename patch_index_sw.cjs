const fs = require('fs');
const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('serviceWorker.register')) {
    content = content.replace(
        /<\/body>/,
        `  <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW ref fail', err));
        });
      }
    </script>
  </body>`
    );
    fs.writeFileSync(file, content);
    console.log('Added SW registration');
}
