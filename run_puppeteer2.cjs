const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('PAGE LOG ERROR:', msg.text());
  });
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:3000/compliance-monthly', {waitUntil: 'networkidle0'});
  
  await new Promise(r => setTimeout(r, 2000));
  
  // print out the text of ErrorBoundary if it exists
  const text = await page.evaluate(() => {
    const errorEl = document.querySelector('.bg-red-50');
    return errorEl ? errorEl.parentElement.innerText : 'NO ERROR BOUNDARY';
  });
  console.log("ErrorBoundary text:", text);
  
  await browser.close();
})();
