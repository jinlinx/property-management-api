import puppeteer from 'puppeteer';
const fs = require('fs');
const env = require('./env');
const get = require('lodash/get');

export async function createPuppeteer(props: any) {
    const browser = await puppeteer.launch(props || env.getCfg());    
    const cookieDir = (name:string)=>get(props, 'cookiesDir', `outputData/${name}_cookies.json`);

    const firstPage = await browser.newPage();
    const create = (page: puppeteer.Page) => {
        page.setDefaultTimeout(60000);
        page.setUserAgent(
            "Mozilla/5.0 (Macintosh-gg; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4182.0 Safari/537.36"
        );
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        const setText = async (selector: string, text: string, doType = true) => {
            const ctl = await page.$(selector);            
            await ctl?.click();
            let last = '';
            if (doType && text.length > 0) {
                last = text[text.length - 1];
                text = text.slice(0,-1);
            }
            await page.evaluate((selector, text) => {
                document.querySelector(selector).value = text;
            }, selector, text);
            if (last !== '') {
                ctl?.type(last);
            }
        };
        const findBy = (what: string, sel:string) => page.$(`[${what}=${sel}]`);
        const setTextBy = (what:string, sel:string,text:string) => setText(`[${what}=${sel}]`, text);            
        return {
            browser,
            firstPage,
            page,
            $: (p:string)=>page.$(p),
            goto: (url:string,opt: any)=>page.goto(url, opt),
            close: () => browser.close(),
            findByCSS: (path:string) => page.$(path),
            findBy,
            findById: (sel:string)=>findBy('id',sel),
            findAllByCss: (path:string) => page.$$(path),
            findByXPath: (path:string)=>page.$x(path),
            setText,
            setTextBy,
            setTextById: (id:string,text:string) => setTextBy('id', id,text),
            setTextByName: (name:string, text:string) => setTextBy('name', name, text),
            getElementText: async (e: puppeteer.ElementHandle<Element>, css:string) => {
                //const ddd = await page.evaluate(el => el.innerHTML, e);
                //console.log(ddd);
                const ele = css? await e.$(css): e;
                const attr = await page.evaluate(el => el.innerHTML, ele);
                return attr;
            },
            screenshot: (path:string) => page.screenshot({ path }),
            loadCookies: async (name:string) => {
                try {
                    const cookies = JSON.parse(fs.readFileSync(cookieDir(name)));
                    page.setCookie(...cookies);
                } catch { }
            },
            saveCookies: async (name:string) => {
                const cookies = await page.cookies();
                await fs.writeFileSync(cookieDir(name), JSON.stringify(cookies, null, 2));
            }
        };
    }
    return { ...create(firstPage), create };
}
