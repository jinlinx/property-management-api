const puppeteer = require('puppeteer');

async function test() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1024,
            height: 768,
            isMobile: false,
        }
    });    
    const page = await browser.newPage();
    await page.setViewport({
        width: 1124,
        height: 768,
        //deviceScaleFactor: 1,
    });
    page.goto('https://www.bankofamerica.com');
}

test();