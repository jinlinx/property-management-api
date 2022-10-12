const moment = require('moment');
const Promise = require('bluebird');
const path = require('path');
const fs = require('fs');
const csvParse = require('csv-parse/sync');
const axios = require('axios');
const { sleep, waitElement,
} = require('../lib/util');

const {
    genProcess,
    cleanHtml,
    cleanSpan,
} = require('./genProc');
const { sign } = require('crypto');
async function processInner(creds, opts) {    
    return await genProcess(creds, doJob, opts);
}

async function doJob(pupp, creds, opts) {
    const { log, getCode } = opts;
    const saveScreenshoot = () => pupp.screenshot('outputData/test.png');    
    //await pupp.loadCookies('jxboa');
    //await waitForDownload(pupp);
    await setDownloadPath(pupp.page);
    await sleep(1000);
    const url = 'https://www.bankofamerica.com/';
    await pupp.goto(url, { waitUntil: 'domcontentloaded'});
    log(`going to ${url}`);
    //await pupp.saveCookies('cashapp');


    log('waiting for login selector')
    await pupp.page.waitForSelector('[id=onlineId1]')
    log('got  login selector')
    //await sleep(1000);
    let prevLen = 0;
    await waitElement({
        message: 'Waiting for login screen',
        waitSeconds: 120,
        action: async () => {
            const activityList = await pupp.findAllByCss('[id=onlineId1]');
            if (!activityList || !activityList.length) {
                log(`Waiting for activity ${new Date().toISOString()}`);
                throw 'no activity';
            }            
        }
    });

    await pupp.setTextById('onlineId1', creds.userName);
    console.log('set onlind id, trying passcode1')
    await pupp.setTextById('passcode1', creds.password);
    console.log('set ', creds.userName, creds.password);
    //const signIn = await pupp.findById('signIn');
    //await signIn.click();

    await pupp.page.waitForSelector('[id=signIn]');
    const signIn = await pupp.page.$('[id=signIn]');
    //await signIn.evaluate(b => b.click());
    //await pupp.page.waitForSelector('[id=signIn111]');
    await Promise.delay(2000);
    await signIn.click();

    const accountsSelector = "[class='AccountItems list-view-tour'] li div span.AccountName a[name$='details']";
    await waitElement({
        message: 'waiting for accounts',
        waitSeconds: 120,
        action: async () => {
            const list = await pupp.findAllByCss(accountsSelector);
            if (!list || list.length === 0) {
                log(`Waiting for account list ${new Date().toISOString()}`);
                throw 'no account list';
            }
        }
    });

    let found = null;
    
    const list = await pupp.findAllByCss(accountsSelector);
    for (let i = 0; i < list.length; i++) {
        const txt = await pupp.getElementText(list[i]);
        console.log(`at ${i} ${txt}`);
        if (txt.match(/Customized Cash/)) {
            console.log('matched');
            found = list[i];
            break;
        }
    }
    
    await Promise.delay(1000);
    await found.click();

    const waitAndFindOneCss = async sel => {
        await pupp.page.waitForSelector(sel);
        return await pupp.findByCSS(sel);
    }
    

    async function findAndClickButton(sel, desc) {
        console.log(`Trying to find ${desc}`);
        const downloadBtn = await waitAndFindOneCss(sel);
        await Promise.delay(1000);
        console.log(`clicking ${desc}`);
        //await downloadBtn.click();
        await pupp.page.evaluate(sel => {
            document.querySelector(sel).click();
        }, sel);
        await Promise.delay(1000);
    }

    //const downloadBtn = await waitAndFindOneCss('a.export-trans-view');
    //await Promise.delay(1000);
    //await downloadBtn.click();
    await findAndClickButton('a.export-trans-view','Download Dialog');    

    async function findDropdownAndSelect(sel, act, desc) {
        console.log(`tring to find dropdown ${desc}`);
        const dropdown = await waitAndFindOneCss(sel);
        console.log('got download', !!dropdown)
        const options = await dropdown.$$('option');
        console.log('got options', options?.length);
        const prms = {
            dropdown,
            position: -1,
        };
        for (let i = 0; i < options.length; i++) {
            const txt = await pupp.getElementText(options[i]);
            const val = await (await options[i].getProperty("value")).jsonValue();
            console.log(`at ${i} ${txt} ${val}`);
            prms.position = i;
            prms.txt = txt;
            prms.val = val;
            if (await act(prms)) break;            
        }        
        if (prms.selected) {
            console.log('selecting ', prms.selected);
            await dropdown.select(prms.selected);
            await Promise.delay(1000);
        }
        return prms;
    }
        
    await findDropdownAndSelect('#select_transaction', async prms => {
        const { txt, val, position,  } = prms;        
        const tm = moment(txt);
        if (tm.isValid()) {
            console.log(`txt=${txt} val=${tm.format('YYYY-MM-DD')}`);
            if (!prms.selected) prms.selected = val;
        }
        console.log(`at ${position} ${txt} ${val}`);        
    }, 'Selection tran date');
    /*
    const tranDropdown = await waitAndFindOneCss(tranSelSel);
    const options = await tranDropdown.$$('option');
    let secondVal = null;
    for (let i = 0; i < options.length; i++) {
        const txt = await pupp.getElementText(options[i]);
        const val = await (await options[i].getProperty("value")).jsonValue();
        const tm = moment(txt);
        if (tm.isValid()) {
            console.log(`txt=${txt} val=${tm.format('YYYY-MM-DD')}`);
            if (!secondVal) secondVal = val;
        }        
        console.log(`at ${i} ${txt} ${val}`);        
    }
    await tranDropdown.select(secondVal);
    await Promise.delay(1000);
    */

    const fileTypeDropdown = await waitAndFindOneCss('#select_filetype');
    await findDropdownAndSelect('#select_filetype', async prms => {
        const { txt, val, position, } = prms;
        if (txt.match(/Microsoft /)) prms.selected = val;
    }, 'select file type');
    await Promise.delay(6000);

    await pupp.page.setRequestInterception(true);
    pupp.page.on('request', async interceptedRequest => {
        //console.log('got request', interceptedRequest.url());
        interceptedRequest.continue()
        if (interceptedRequest.url().match(/download-transactions.go/)) {
            const cookies = await pupp.page.cookies();
            console.log('headers', interceptedRequest.headers())
            //console.log('cookies', cookies);
            console.log('cookies', interceptedRequest.method());
            const headers = { ...interceptedRequest.headers() }
            headers.cookie = cookies.map(ck => ck.name + '=' + ck.value).join(';');
            const rsp = await axios.get(interceptedRequest.url() , {
                headers,
            });
            console.log('rsp',rsp.data, rsp.data.length)
        }
        //interceptedRequest.abort();     //stop intercepting requests
        //resolve(interceptedRequest);
    });
    pupp.page.on('response', async response => {        
        //await response.continue();
        if (response.url().match(/download-transactions.go/)) {
            console.log('got response', response.url());
            try
            {
                const buf = await response.buffer();
                console.log('got response buffer');
                console.log(await response.text())
            } catch (err) {
                console.log('cant load rsp txt',err.message);
            }
        }
        
        //interceptedRequest.abort();     //stop intercepting requests
        //resolve(interceptedRequest);
    });
    await findAndClickButton('.submit-download', 'Download file');
    //await pupp.saveCookies('jxboa1');
    //console.log('new cookie saved');

    console.log('done wait 600s');
    //await waitForDownload(pupp);
    await Promise.delay(6000000);

    await pupp.page.waitForSelector('[id=signIn111]');    
}


function getDownloadPath() {
    const downloadPath = process.env.DOWNLOAD_PATH || '/temp';
    console.log(`download path is ${downloadPath}`);
    return downloadPath;
}

async function setDownloadPath(page) {
    const downloadPath = getDownloadPath();
    await page._client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
    });
}

async function waitForDownload(pupp) {
    const downloadPath = getDownloadPath();    
    const browser = pupp.browser;
    const dmPage = await browser.newPage();
    await dmPage.goto("chrome://downloads/");

    await dmPage.bringToFront();
    
    //dmPage.wai

    console.log('eval handling');
    //const downloadMgr = await dmPage.$('downloads-manager');
    //document.querySelector('downloads-manager').shadowRoot.querySelector('#mainContainer #downloadsList downloads-item')
    //document.querySelector('downloads-manager').shadowRoot.querySelector('#mainContainer #downloadsList downloads-item').shadowRoot.querySelector('#content #details #title-area a')
    //console.log('download mangger', downloadMgr, downloadMgr?.shadowRoot);
    //const cur = await dmPage.evaluateHandle(`document.querySelector('downloads-manager').shadowRoot.querySelector('#mainContainer #downloadsList downloads-item').shadowRoot.querySelector('#content #details #title-area a')`);
    const cur = await dmPage.evaluate(() => {
        const ret = document.querySelector('downloads-manager').shadowRoot.querySelector('#mainContainer #downloadsList downloads-item').shadowRoot.querySelector('#content #details #title-area a');
        console.log('got ret', ret.innerHTML);
        return {
            html: ret.innerHTML,
            href: ret.href,
        };
    });


    if (!cur) console.log('trace failed');
    console.log('download texst', cur);
    

    const csvStr = fs.readFileSync(path.join(downloadPath, cur.html));

    console.log('csvStr is ', csvStr);
    const csvRes = csvParse.parse(csvStr);
    console.log('done', csvRes);

    await Promise.delay(6000000);
    await dmPage.waitForFunction(() => {
        try {
            //const donePath = document.querySelector("downloads-manager")!.shadowRoot!
            //    .querySelector(
            //        "#frb0",
            //    )!.shadowRoot!.querySelector("#pauseOrResume")!;
            //if ((donePath as HTMLButtonElement).innerText != "Pause") {
            //    return true;
            //}
        } catch {
            //
        }
        return true;
    }, { timeout: 0 });
    console.log("Download finished");
}

module.exports = {
    process: processInner,
}
