import puppeteer from 'puppeteer';
const fs = require('fs');
const env = require('./env');
import { get, sortBy} from 'lodash';

type IPuppSingleRet = Promise<puppeteer.ElementHandle<Element> | null>;
type IPuppMultiRet = Promise<puppeteer.ElementHandle<Element>[]>;
export interface IPuppWrapper {
    browser: puppeteer.Browser;
    page: puppeteer.Page;
    $: (p: string) => IPuppSingleRet;
    goto: (url: string, opt: any) => any;
    close: () => Promise<void>; findByCSS: (path: string) => IPuppSingleRet; findBy: (what: string, sel: string) => IPuppSingleRet;
    findById: (sel: string) => IPuppSingleRet;
    findAllByCss: (path: string) => IPuppMultiRet;
    findByXPath: (path: string) => IPuppMultiRet;
    setText: (selector: string, text: string, doType?: boolean) => Promise<void>;
    setTextBy: (what: string, sel: string, text: string) => Promise<void>;
    setTextById: (id: string, text: string) => Promise<void>;
    setTextByName: (name: string, text: string) => Promise<void>;
    getElementHtml: (e: any, css?: string) => Promise<any>;
    getElementTextContent: (e: any, css?: string) => Promise<any>;
    screenshot: (path: string) => Promise<string | Buffer>;
    loadCookies: (name: string) => Promise<void>;
    saveCookies: (name: string) => Promise<void>;
    getAttribute: (ele: puppeteer.ElementHandle<Element>, clsName: string)=> Promise<any>;
}

export async function createPuppeteer(props: any): Promise<IPuppWrapper> {
    const browser = await puppeteer.launch(props || env.getCfg());
    const cookieDir = (name: string) => get(props, 'cookiesDir', `outputData/${name}_cookies.json`);

    const page = await browser.newPage();
    
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    page.setDefaultTimeout(60000);
    //page.setUserAgent(
    //    "Mozilla/5.0 (Macintosh-gg; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4182.0 Safari/537.36"
    //);
    page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36"
    );
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    const setText = async (selector: string, text: string, doType = true) => {
        const ctl = await page.$(selector);
        await ctl?.click();
        let last = '';
        if (doType && text.length > 0) {
            last = text[text.length - 1];
            text = text.slice(0, -1);
        }
        await page.evaluate((selector, text) => {
            document.querySelector(selector).value = text;
        }, selector, text);
        if (last !== '') {
            ctl?.type(last);
        }
    };
    const findBy = (what: string, sel: string) => page.$(`[${what}=${sel}]`);
    const setTextBy = (what: string, sel: string, text: string) => setText(`[${what}=${sel}]`, text);
    const getAttribute = async (ele: puppeteer.ElementHandle<Element>, clsName:string) => {
        await page.evaluate(el => el.getAttribute(clsName), ele)
    }
    return {
        browser,
        page,
        $: (p: string) => page.$(p),
        goto: (url: string, opt: any) => page.goto(url, opt),
        close: () => browser.close(),
        findByCSS: (path: string) => page.$(path),
        findBy,
        findById: (sel: string) => findBy('id', sel),
        findAllByCss: (path: string) => page.$$(path),
        findByXPath: (path: string) => page.$x(path),
        setText,
        setTextBy,
        setTextById: (id: string, text: string) => setTextBy('id', id, text),
        setTextByName: (name: string, text: string) => setTextBy('name', name, text),
        getElementHtml: async (e: puppeteer.ElementHandle<Element>, css?: string) => {
            //const ddd = await page.evaluate(el => el.innerHTML, e);
            //console.log(ddd);
            const ele = css ? await e.$(css) : e;
            const attr = await page.evaluate(el => el.innerHTML, ele);
            return attr;
        },
        getElementTextContent: async (e: puppeteer.ElementHandle<Element>, css?: string) => {
            //const ddd = await page.evaluate(el => el.innerHTML, e);
            //console.log(ddd);
            const ele = css ? await e.$(css) : e;
            const attr = await page.evaluate(el => el.textContent, ele);
            return attr;
        },
        screenshot: (path: string) => page.screenshot({ path }),
        getAttribute,
        loadCookies: async (name: string) => {
            let cookies = null;
            try {
                cookies = JSON.parse(fs.readFileSync(cookieDir(name)));                
            } catch { }
            if (!cookies) {
                console.log('no cookies found');
            }else 
                console.log('cookies loaded', !!cookies)
            if (cookies) {
                page.setCookie(...cookies);
                console.log('cookies set');
            }
        },
        saveCookies: async (name: string) => {
            //const cookies = await page.cookies();
            const client = await page.target().createCDPSession();
            const cookiesWrapped = await client.send('Network.getAllCookies');
            //await fs.writeFileSync(cookieDir('unsorted_'+name), JSON.stringify(cookies, null, 2));
            //console.log('orig cookies', cookies);
            const cookieSorted = sortBy(cookiesWrapped.cookies, ['name']);
            //console.log('sorted cookies', cookies);
            await fs.writeFileSync(cookieDir(name), JSON.stringify(cookieSorted, null, 2));
        }
    };
        
}
