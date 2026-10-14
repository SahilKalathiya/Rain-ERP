const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1400, height: 1200 }
  });

  const page = await browser.newPage();
  
  // Set auth state
  await page.goto('http://localhost:3000/react/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('rain_erp_user', JSON.stringify({ email: 'saksham.garg@rainerp.com', name: 'Saksham Garg', role: 'admin' }));
    localStorage.setItem('erp_auth_user', JSON.stringify({ email: 'saksham.garg@rainerp.com', name: 'Saksham Garg', role: 'admin' }));
  });

  // Wait for table to load
  await page.waitForSelector('button[title="View Details"]');
  const viewBtns = await page.$$('button[title="View Details"]');
  if (viewBtns.length > 0) {
    await viewBtns[0].click();
    await new Promise(r => setTimeout(r, 1500));
  }

  // Scroll down to the bottom
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(r => setTimeout(r, 1000));

  // Take screenshot of bottom (Fabric + BOM)
  await page.screenshot({ path: 'scratch_bom_view.png' });
  console.log('SCREENSHOT_SAVED_SUCCESS');

  await browser.close();
})();
