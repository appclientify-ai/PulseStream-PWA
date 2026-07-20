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
    await page.type('input[type="email"]', 'appclientify@gmail.com');
    await page.type('input[type="password"]', 'password'); // or whatever
    await page.click('button[type="submit"]');
    await page.waitForNavigation({waitUntil: 'networkidle0'});
    console.log("Logged in");
  } catch(e) {
    console.log("Login failed or skipped:", e.message);
  }

  // click on Monthly Filing
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('a, button, div')).find(el => el.textContent.includes('Monthly Filing'));
    if(el) el.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // click on Quarterly Filing
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('a, button, div')).find(el => el.textContent.includes('Quarterly Filing'));
    if(el) el.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  await browser.close();
})();
