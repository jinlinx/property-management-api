import moment from 'moment';
const csvParse = require('csv-parse/sync');
const axios = require('axios');
const { sleep, waitElement,
} = require('../lib/util');

import {  IPuppOpts, ILog } from './genProc';
import {  IPuppWrapper } from '../lib/chromPupp';




export interface IChaseDownloadFileRet {
    date: string;
    reference: string;
    payee: string;
    address: string;
    amount: number;
}

export async function doJob(pupp: IPuppWrapper, opts: IPuppOpts): Promise<IChaseDownloadFileRet[]>{
    const log = opts.log;
    const creds = opts.creds;  
    await pupp.loadCookies('jxchase');
    //await waitForDownload(pupp);
    await setDownloadPath(pupp.page, log);
    await sleep(1000);
    const url = 'https://www.chase.com';
    await pupp.goto(url, { waitUntil: 'domcontentloaded'});
    log(`going to ${url}`);
    await pupp.page.waitForSelector('iframe');
    log(`got frames`);
    const frames = pupp.page.frames();
    console.log('frame count', frames.length);
    const frameHandle = await pupp.page.$('iframe[id=logonbox]');
    const frame = await frameHandle?.contentFrame();
    if (!frame) throw 'failed to acquire frame';    
    console.log('debug debug page', !!pupp.page);

    const waitAndFindOneCss = async (sel: string) => {
        await pupp.page.waitForSelector(sel);
        return await pupp.findByCSS(sel);
    }

    const loginBoxCss = '[id=userId-text-input-field]';    

    
    await frame.waitForSelector(loginBoxCss);
    log('found login user name field');
    await sleep(3000);
    await frame.type('[id=userId-text-input-field]', creds.userName, { delay: 200 });
    await frame.type('[id=password-text-input-field]', creds.password, { delay: 200 });
    //await pupp.setTextById('userId-text-input-field', creds.userName);
    //await pupp.setTextById('password-text-input-field', creds.password);

    await sleep(1000);
    async function findAndClickButtonInFrame(sel: string, desc: string) {
        log(`Trying to find ${desc}`);
        const btn = await frame?.waitForSelector(sel);
        await sleep(1000);
        log(`clicking ${desc}`);
        //await downloadBtn.click();
        await btn?.click();
        await sleep(1000);
    }
    async function findAndClickButton(sel: string, desc: string) {
        log(`Trying to find ${desc}`);
        const downloadBtn = await waitAndFindOneCss(sel);
        await sleep(1000);
        log(`clicking ${desc}`);
        //await downloadBtn.click();
        await pupp.page.evaluate((sel: string) => {
            (document.querySelector(sel) as HTMLButtonElement).click();
        }, sel);
        await sleep(1000);
    }
    
    log('waiting for login selector')    
    await findAndClickButtonInFrame('[id=signin-button]', 'click sign in button');
    log('got  login selector')    

    async function CheckLogin() {        
        while (await pupp.findByCSS(loginBoxCss)) {
            log('Found login again, retry');
            await pupp.page.type('[id=userId-text-input-field]', creds.userName, { delay: 200 });
            await pupp.page.type('[id=password-text-input-field]', creds.password, { delay: 200 });
            await sleep(500);
            await findAndClickButton('[id=signin-button]', 'click sign in button');
            await sleep(3000);
        }
    }

    await sleep(2000);
    let codeUsed = false;
    //await CheckLogin();
    const inAccountCss = '[id=accountCurrentBalanceLinkWithReconFlyoutValue]';
    await waitElement({
        message: 'waiting for login or code',
        waitSeconds: 12000,
        action: async () => {
            const codeSel = await pupp.findByCSS('[id=header-simplerAuth-dropdownoptions-styledselect]');
            const inAccountCheck = await pupp.findByCSS(inAccountCss);
            if (!codeSel && !inAccountCheck) {
                log(`Waiting for login css ${new Date().toISOString()}`);
                throw 'no Code sel';
            }
            if (inAccountCheck) {
                return;
            }
            if (!codeSel) return;
            await codeSel.click();
            log('waiting for code option 1');
            const codeOpt1Css = '[id=container-1-simplerAuth-dropdownoptions-styledselect';
            await waitAndFindOneCss(codeOpt1Css);
            await findAndClickButton(codeOpt1Css, 'clicking on code options 1');
            await sleep(2000);
            await findAndClickButton('[id=requestIdentificationCode-sm]', 'submit Code');
            await sleep(2000);
            const codePwdCssId = 'password_input-input-field';
            await waitAndFindOneCss(`[id=${codePwdCssId}]`);
            log('set text by id');
            await pupp.setTextById(codePwdCssId, opts.creds.password);
            codeUsed = true;
            
        }
    });
    log('found css' + loginBoxCss);
    await sleep(3000);
    log('saving cookie');
    await pupp.saveCookies('jxchase');
    
    log('waiting for account');
    await pupp.page.waitForSelector(inAccountCss);
    log('got account');
    if (codeUsed) {
        await sleep(3000);
        log('saved account');
        await pupp.saveCookies('jxchase');
        await sleep(3000);
        await pupp.saveCookies('jxchase_acct');
        log('saved acct account');
    } else {
        log('Non code path');
    }
    await sleep(300000);
    const res: IChaseDownloadFileRet[] = [];
    return res;

}


function getDownloadPath(log: ILog) {
    const downloadPath = process.env.DOWNLOAD_PATH || '/temp';
    log(`download path is ${downloadPath}`);
    return downloadPath;
}

async function setDownloadPath(page: any, log: ILog) {
    const downloadPath = getDownloadPath(log);
    await page._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
    });
}

//async function waitForDownload(csvStr) {
    //const downloadPath = getDownloadPath();    
    //const browser = pupp.browser;
    //const dmPage = await browser.newPage();
    //await dmPage.goto("chrome://downloads/");

    //await dmPage.bringToFront();
    //const downloadMgr = await dmPage.$('downloads-manager');
    //document.querySelector('downloads-manager').shadowRoot.querySelector('#mainContainer #downloadsList downloads-item').shadowRoot.querySelector('#content #details #title-area a')
    //console.log('download mangger', downloadMgr, downloadMgr?.shadowRoot);
    //const cur = await dmPage.evaluateHandle(`document.querySelector('downloads-manager').shadowRoot.querySelector('#mainContainer #downloadsList downloads-item').shadowRoot.querySelector('#content #details #title-area a')`);
    //const cur = await dmPage.evaluate(() => {
    //    const ret = document.querySelector('downloads-manager').shadowRoot.querySelector('#mainContainer #downloadsList downloads-item').shadowRoot.querySelector('#content #details #title-area a');
    //    console.log('got ret', ret.innerHTML);
    //    return {
    //        html: ret.innerHTML,
    //        href: ret.href,
    //    };
    //});
//}
