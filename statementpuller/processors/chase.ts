import moment from 'moment';
//const csvParse = require('csv-parse/sync');
//const axios = require('axios');
import { sleep, waitElement } from '../lib/util';

import {  IPuppOpts, ILog } from './genProc';
import {  IPuppWrapper } from '../lib/chromPupp';
import {
    IGenDownloadFileRet, loopDebug,
    prepareFileClickInterception,
} from './gens';

import { useGenDataToCompareUpdateSheet} from './procAndCompGeneric'


export async function doJob(pupp: IPuppWrapper, opts: IPuppOpts): Promise<IGenDownloadFileRet[]>{
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
    await frame.type('[id=userId-text-input-field]', creds.userName, { delay: 100 });
    await frame.type('[id=password-text-input-field]', creds.password, { delay: 100 });
    //await pupp.setTextById('userId-text-input-field', creds.userName);
    //await pupp.setTextById('password-text-input-field', creds.password);

    await sleep(1000);
    async function findAndClickButtonInFrame(sel: string, desc: string) {
        log(`Trying to find ${desc}`);
        const btn = await frame?.waitForSelector(sel);
        await sleep(1000);
        log(`clicking ${desc}`);
        //await downloadBtn.click();
        try {
            await btn?.click();
        } catch (err) {            
            if (btn) {
                opts.log('error click, try eval');
                await pupp.page.evaluate(el => el.click(), btn);
            } else throw err;
        }
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

    await sleep(2000);
    await findAndClickButton('[id=singleSummaryAccountName] h2 mds-link', 'expanding');
    log('done clicking expanding');
    const dataRowSel = '[id=activityTableslideInActivity] tbody tr';
    await sleep(1000);
    log('waitting for dataRows ' + dataRowSel);
    let hasRows = true;
    try {
        await pupp.page.waitForSelector(dataRowSel, {
            timeout: 5000,
        });
    } catch {
        hasRows = false;
        log('no current transactions');
    }
    const rows = hasRows? await pupp.page.$$(dataRowSel) : [];

    const allRows: IGenDownloadFileRet[] = [];
    for (let r of rows) {
        const tds = await r.$$('td');
        //log('new Row------------------------------');
        const data = {
            processor: 'AutoImport Chase Card',
        } as IGenDownloadFileRet;
        for (let tdi = 0; tdi < tds.length; tdi++) {
            const td = tds[tdi];
            /*
            <td class="date BODY grouped-date" data-th="Date" tabindex="-1"> 0
                <span class="column-info">Oct 5, 2022</span>
            </td>
            <td class="description has-expand BODY" data-th="Description" tabindex="-1">  
                <span class="show-xs hide-sm BODY column-info">LOWES xxx </span> 
                    <div class="small-seedetail-link">
                        <span class="hide-xs show-sm BODY">LOWES*  </span>
                    </div>
                    <div class="transaction-detail-section"></div>
            </td>
            <td class="category BODY" data-th="Category">
               <span class="BODY category-dropdown">
               <div class="inline-content"><mds-link class="drop-link mds-link--bcb" id="categoryLink_202210051829042220928#20220928" text="Home" accessible-text=", opens menu" data-categoryid="HOME" end-icon="ico_chevron_down" data-transactionindex="40" data-transactionid="202210051829042220928#20220928" is-button="false" href="javascript:void(0)" underline="false" accessible-text-prefix="" tab-focusable="true" inverse="false" leading-pipe="false" trailing-pipe="false" inactive="false" truncation="none"></mds-link></div></span>     </td><td class="sm-aligned-right amount BODY" data-th="Amount" tabindex="-1">    <span class="column-info">$10.44</span>     </td> <td class="util aligned right print-hide BODY etd-xs-link" data-th="Action"> <mds-button class="etd-action-icon mds-button--bcb" icon-accessible-description="See details about this transaction" accessible-text="See details about this transaction" icon-position="icon_only" icon-type="ico_chevron_right" id="transactionDetailIcon-slideInActivity-40" variant="tertiary" width-type="content" small="false" inactive="false" tab-focusable="true" type="button" inverse="false"></mds-button></td>
            */
            const clsName = await pupp.getAttribute(td, 'class');
            //class="drop-link mds-link--bcb" id="categoryLink_202210241741135220928#20220928"
            //text = "Food &amp; drink" accessible - text=", opens menu" data - categoryid="FOOD" end - icon="ico_chevron_down" data - transactionindex="1" data - transactionid="202210241741135220928#20220928" is - button="false" href = "javascript:void(0)" underline = "false" accessible - text - prefix="" tab - focusable="true" inverse = "false" leading - pipe="false" trailing
            //opts.log('mds outerHTML====' + await pupp.getProperty(mds, 'outerHTML'));
            //opts.log('===== class ' + i + " " + clsName);
            if (clsName.match(/date/)) {
                const date = (await pupp.getElementTextContent(td)).trim()
                data.date = moment(date).format('YYYY-MM-DD');
                //opts.log('===== date ' + data.date);
                //opts.log('===== date ' + moment(data.date).format('YYYY-MM-DD'));
            } else if (clsName.match(/category/)) {
                const mds = (await td.$('mds-link'));
                if (mds) {
                    data.category = await pupp.getAttribute(mds, 'text');
                    data.reference = await pupp.getAttribute(mds, 'data-transactionid');
                    //opts.log('===== category ' + data.category);
                    //opts.log('===== data-transactionid ' + await pupp.getAttribute(mds, 'data-transactionid'));
                }
            } else if (clsName.match(/amount/)) {
                const amount = (await pupp.getElementTextContent(td)).trim();
                data.amount = parseFloat(amount.replace(/[$,]/g, ''));
                //opts.log('===== amount ' + data.amount);
            } else if (clsName.match(/description/)) {
                const sp = await td.$('span')
                const desc = (await pupp.getElementTextContent(sp));
                //const outer = await pupp.getProperty(td, 'outerHTML');
                data.payee = desc?.trim();                
                //opts.log('===== desc ' + data.desc);
            }            
        }        
        if (data.payee === 'AUTOMATIC PAYMENT - THANK') continue;
        allRows.push(data);
    }

    if (opts.debug) {
        await loopDebug(pupp, opts, { elments: rows, downloadFile, useGenDataToCompareUpdateSheet });
    }
    log('all done');
    return allRows;

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

async function downloadFile(pupp: IPuppWrapper, opts: IPuppOpts, monthOffset = 0) {
    const result = {
        found: false,
        data: '',
    }
    const accountOptionsDropdown = await pupp.page.$('div.account-options div a');
    await pupp.page.evaluate((ele) => ele.click(), accountOptionsDropdown);

    const accountOptions = await pupp.page.$$('div.account-options div div ul li');

    const curDateMoment = moment().add(monthOffset, 'month');
    const lastMonStr = curDateMoment.format('MMM') + ' \\d{1,2}, ' + curDateMoment.format('YYYY');
    opts.log('downloadFile: has -----  ' + lastMonStr)
    
    for (let aoi in accountOptions) {
        const curOpt = accountOptions[aoi];
        const curA = await curOpt.$('a');
        const aText = await pupp.getElementTextContent(curA);
        opts.log(aText);
        if (aText.match(new RegExp(lastMonStr))) {
            opts.log('downloadFile: found date ' + aText)
            await pupp.page.evaluate((ele) => ele.click(), curA);
            //sleep(1000);
            const mdsd = await pupp.page.$('mds-button.download');
            //await prepareFileClickInterception(pupp, 'download', { log: opts.log })
            await sleep(1000);
            opts.log('downloadFile: clicking-------')
            result.found = true;
            await mdsd?.click();
            break;
        }
    }

    if (!result.found) result;
    opts.log('downloadFile: waiting download button');
    await sleep(2000);
    //return;
    const downBtn = await pupp.page.$('[id=download]');
    opts.log('downloadFile: downbtn');
    await sleep(1000);
    opts.log('downloadFile: context111 before call');

    //return;
    const awaiter = await prepareFileClickInterception(pupp, 'v2/account/activity/card/download', opts)
    opts.log('downloadFile: context111 clicking!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', awaiter)
    await downBtn?.click();
    try {
        opts.log('downloadFile: awaiting result ');
        const rr = await awaiter.wait;

        opts.log('downloadFile: done awaiting---------------------------------', rr);
        result.data = rr as any as string;
    } catch (err) {
        opts.log('downloadFile: error wait click', err);
    }
    const backToAccounts = '[id=backToAccounts]';
    await pupp.page.waitForSelector(backToAccounts)
    const backToAccountsBtn = await pupp.page.$(backToAccounts);
    await backToAccountsBtn?.click();
    opts.log('downloadFile: context done ' + lastMonStr);
    //pupp.requestInterceptors = [];
    //await pupp.page.setRequestInterception(false); 
    return result.data;
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
