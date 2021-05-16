const puppeteer = require('puppeteer');

(async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://duckduckgo.com')
  await page.screenshot({ path: 'page.png' })

  await browser.close()
})()