const puppeteer = require('puppeteer');

async function test() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1124,
            height: 768,
            isMobile: false,
        }
    });    
    const page = await browser.newPage();
    page.setUserAgent(
        "Mozilla/5.0 (Macintosh-gg; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4182.0 Safari/537.36"
    );
    //const context = await browser.createIncognitoBrowserContext();
    //const page = await context.newPage();

    await page.setViewport({
        width: 1124,
        height: 768,
        //deviceScaleFactor: 1,
    });
    page.goto('https://www.bankofamerica.com');
}

test();