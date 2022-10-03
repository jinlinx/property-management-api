const moment = require('moment');
const Promise = require('bluebird');
const { sleep, waitElement,
} = require('../lib/util');

const {
    genProcess,
    cleanHtml,
    cleanSpan,
} = require('./genProc');
const { sign } = require('crypto');
async function process(creds, opts) {
    return await genProcess(creds, doJob, opts);
}

async function doJob(pupp, creds, opts) {
    const { log, getCode } = opts;
    const saveScreenshoot = () => pupp.screenshot('outputData/test.png');    
    await pupp.loadCookies('jxboa');
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
    await Promise.delay(2000);
    await pupp.saveCookies('jxboa1');
    await pupp.page.waitForSelector('[id=signIn111]');
}


async function orig() {
    const loggedInCheck = async () => {
        const name = await pupp.findByCSS('.name');
        if (name) {
            const text = await pupp.getElementText(name);
            return text;
        }
    }
    await waitElement({
        message: 'Waiting page startup',
        //const readyState = await driver.executeScript("return document.readyState");        
        action: async () => {
            await saveScreenshoot();

            const loggedIn = await loggedInCheck();
            log(`logged in is ${loggedIn}`);
            if (loggedIn) return;
            await pupp.setTextById('alias', creds.userName);


            const next = await pupp.findByCSS('#ember386 button');
            if (next === null) {
                await pupp.goto(url);
                await sleep(2000);
            }
            await next.click();
            await sleep(1000);
        }
    });


    const codeRes = await waitElement({
        message: 'Code',
        waitSeconds: 60,
        action: async () => {
            const loggedIn = await loggedInCheck();
            log(`logged in is ${loggedIn}`);
            if (loggedIn) return;
            await sleep(500);
            await saveScreenshoot();
            await pupp.findById('code')
            let code = '';
            try {
                code = await getCode();
            } catch (err) {
                log(`Code Error ${err.message}`);
                console.log('code');
                console.log(err);
                throw err;
            }

            //recaptcha-checkbox-border
            await pupp.setTextById('code', code);
            log(`set code ${code}`);
            const btn = await pupp.findByCSS('#ember542 button');
            btn.click();
            log('clicking code submit button');
            await sleep(500);

        }
    });


    await waitElement({
        message: 'Confirm Selection',
        waitSeconds: 60,
        action: async () => {
            await sleep(500);
            const loggedIn = await loggedInCheck();
            log(`logged in is ${loggedIn}`);
            if (loggedIn) return;
            let err1 = null;
            try {
                const btns = await pupp.findAllByCss('.selection-option-list a.button.theme-button');
                log(`confirmation btn cnt ${btns ? btns.length : 'null'}`)
                btns[1].click();
            } catch (err) {
                err1 = err;
            }

            let err2 = null;
            if (err1) {
                //<div contenteditable="" tabindex="1" id="ember610" class="passcode-inputs-bubble flex-container flex-h ember-view">
                const bubbles = await pupp.findByCSS('.passcode-inputs-bubble');
                if (bubbles) {
                    pupp.setTextById('ember610', creds.pin);
                    log(`pin set, sleeping ${creds.pin}`);
                    await sleep(2000);
                } else {
                    err2 = new Error('pin not found');
                }
            }

            if (err1 || err2) {
                throw err1 || err2;
            }
        }
    });

    log('Saving cookies');
    await pupp.saveCookies();
    log('cookies saved');
}

module.exports = {
    process,
}
