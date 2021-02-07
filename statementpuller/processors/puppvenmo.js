const fs = require('fs');
//const { createPuppeteer } = require('../lib/chromPupp');
const { sleep,
    waitElement,
    readOneLine,
    pmap1,
} = require('../lib/util');
const moment = require('moment');
const { genProcess } = require('./genProc');
async function process(creds, opts) {
    return genProcess(creds, doJob, opts)    
}

async function init(pupp, creds) {
    await pupp.goto('https://venmo.com/account/sign-in'); //creds.url
    await pupp.loadCookies('venmo');
    let tryNum = 0;
    while (true) {
        try {
            console.log('opened');
            //(await pupp.$('a.sign-in.active')).click();
            await sleep(1000);
            console.log('went to active, gong user try ' + tryNum);
            tryNum++;
            await pupp.setTextByName('phoneEmailUsername', creds.userName);
            await pupp.setTextByName('password', creds.password);
            const btn = await pupp.$('.auth-button');
            console.log('auth clock');
            await sleep(1500);
            await btn.click();
            await sleep(1500);
            if (tryNum > 1) {
                tryNum = 0;
                console.log('retry auth');
                await pupp.goto('https://venmo.com/account/sign-in'); //creds.url
            } else {
                console.log('auth clicked');
            }
        } catch {

            console.log('done, breaking')
            break;
        }
    }
}

async function doJob(pupp, creds, opts) {
    const log = opts.log;
    const daysOff = opts.daysOff || 0;
    await init(pupp, creds);
    const saveScreenshoot = () => pupp.screenshot('outputData/test.png');

    const loggedInCheck = async () => {
        const jl = await pupp.findByXPath("//*[text()[contains(.,'Jinlin Xie')]]");
        if (!jl) throw { message: 'not ready' };
    }
    const CheckCode = async () => {
        await sleep(1000);
        await saveScreenshoot();
        const sendCode = await pupp.findByCSS('.mfa-button-code-prompt');
        await saveScreenshoot();
        log('Need code');
        await sleep(1000);
        await sendCode.click();

        await waitElement({
            message: 'WaitSendCode',
            waitSeconds: 5,
            action: async () => {
                const codeField = await pupp.findByCSS('.auth-form-input');
                const code = await readOneLine('Please input code');
                pupp.setText('.auth-form-input', code);
                let btn = await pupp.findByCSS('.auth-button');
                await sleep(1000);
                btn.click();
                await sleep(3000);

                //document.querySelector("#content > div > div > div > form > div > button.ladda-button.auth-button")
                ////*[@id="content"]/div/div/div/form/div/button[1]
                //#content > div > div > div > form > div > button.ladda-button.auth-button
                //const NoRemember = await pupp.findByCSS('.mfa-button-do-not-remember');
                btn = await pupp.findByCSS('button.ladda-button.auth-button');
                btn.click();
                await sleep(3000);
            }
        });

    }
    await waitElement({
        message: 'close Notification',
        waitSeconds: 60,
        action: async () => {
            await sleep(1000);
            await saveScreenshoot();
            let good = false;
            try {
                await CheckCode();
                good = true;
            } catch (e) {
                log('Not waiting for code step');
            }
            try {
                await loggedInCheck()
                good = true;
            } catch {
                log('not login');
            }
            if (!good) throw {
                message: 'waiting for code or main screen'
            };
        }
    });

    //const cookies = await pupp.page.cookies();
    //await fs.writeFile('outputData/test.png', JSON.stringify(cookies, null, 2));
    await pupp.saveCookies('venmo');
    //await sleep(10000);



    //step2
    const statementUrl = `https://venmo.com/account/statement?end=${moment().add(-daysOff,'days').format('MM-DD-YYYY')}&start=${moment().add(-59-daysOff, 'days').format('MM-DD-YYYY')}`;
    log(statementUrl);
    await saveScreenshoot();
    pupp.goto(statementUrl);
    await sleep(2000);
    await saveScreenshoot();
    await waitElement({
        message: 'Wait entrance',
        waitSeconds: 5,
        action: async () => {
            await saveScreenshoot();
            await sleep(1000);
            const tran = await pupp.findByXPath("//*[text()[contains(.,'Completed Transactions')]]");
            if (!tran) throw { message: 'need tran' }
        }
    });


    const transfers = await getStatements(pupp, log);
    //log(transfers);

    log('done');
    await saveScreenshoot();
    return transfers;
}
async function getStatements(pupp, log) {
    const cleanHtml = str => str.replace(/<!--(.*?)-->/gm, "");
    const cleanSpan = str => str.replace(/<[/]{0,1}span(.*?)>/gm, '');

    const recTryTxt = async (itm, css) => {
        for (let i = 0; i < 3; i++) {
            try {
                return await pupp.getElementText(itm, css);
            } catch (e) {
                if (i === 2) throw e;
                console.log(`Retrying ${i} for ${css}`);
            }
        }
    }
    const statementItems = await pupp.findAllByCss('.statement-item');
    return await pmap1(statementItems, async itm => {
        //while (true) {
        //    const css = await readOneLine('enter data');
        //    console.log(css);
        //    const found = await itm.findElements(By.css(css));
        //    await pmap1(found, async f => {
        //        console.log(await f.getAttribute('innerHTML')); 
        //    });        
        //}
        const dateStr = await pupp.getElementText(itm, '.item-date > a > span');
        const date = moment(dateStr,'MM-DD-YYYY').format('YYYY-MM-DD')
        log(date);
        let titles = [];
        let subTitle;
        try {
            // for (let i = 0; i < 3; i++) {
            //     const css = await readOneLine('enter css');
            //     console.log(css);
            //     try {
            //         const title2 = await pupp.getElementText(itm, css);
            //         console.log(title2);
            //         const stitle = await pupp.getElementText(itm, '.item-title > span');
            //         console.log(stitle);
            //     } catch (e) {
            //         console.log(e);
            //     }
            // }
            //const ttt = await pupp.getElementText(itm, '.item-title');
            //console.log(`ttt= ${ttt}`);
            const title = await recTryTxt(itm, '.item-title > span');
            log(title);
            const names = title.match(/<span.*>(.+)?<\/span>(.*)<span.*>(.+)?<\/span>/);
            titles = names.slice(1).map(cleanHtml);
            log(' titleType1=>' + names[1] + ',' + cleanHtml(names[2]) + ', ' + names[3]);
        } catch(e) {
            log('debug title for span failed ' + e.message);
            const title = await pupp.getElementText(itm, '.item-title');
            titles[0] = cleanHtml(title);
            log(' titleType2=>' + titles[0]);
        }
        try {
            subTitle = await recTryTxt(itm, '.item-subtitle > span');            
            subTitle = cleanSpan(subTitle);
            console.log('subtitle1=>' + subTitle);
        } catch {
            const subtitle = await pupp.getElementText(itm, '.item-subtitle');
            subTitle = cleanHtml(subtitle);            
            console.log('subtitle2=>' + subTitle);
        }
        const amountStr = await pupp.getElementText(itm, '.item-delta-text');
        const amount = cleanHtml(amountStr).replace(/,/g, '').replace(/[$]/g, '');
        const famount = parseFloat(amount);
        log('amt' + amount);
        return {
            date,
            //titles,
            name: amount>0?titles[0]:titles[2],
            notes:subTitle,
            amount,
            source:'venmo',
        };
    }, 10);
}

module.exports
    = {
    process,
}