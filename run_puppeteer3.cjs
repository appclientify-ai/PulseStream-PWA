const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('PAGE LOG ERROR:', msg.text());
  });
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:3000', {waitUntil: 'networkidle0'});
  
  // try to login
  try {
    await page.type('input[type="text"]', 'testuser');
    await page.type('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({waitUntil: 'networkidle0'});
    console.log("Logged in");
  } catch(e) {
    console.log("Login failed or skipped:", e.message);
  }

  // navigate to monthly filing
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
