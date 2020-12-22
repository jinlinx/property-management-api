const moment = require('moment');
const Promise = require('bluebird');
const { sleep, waitElement,
} = require('../lib/util');

const {
    genProcess,
    cleanHtml,
    cleanSpan,
} = require('./genProc');
async function process(creds, opts) {
    return await genProcess(creds, doJob, opts);
}

async function doJob(pupp, creds, opts) {
    const { log, getCode } = opts;
    const saveScreenshoot = () => pupp.screenshot('outputData/test.png');
    //const url = 'https://cash.app/login?return_to=account.index';
    //const url = 'http://localhost:3001';
    await pupp.loadCookies();
    await sleep(1000);
    const url = 'https://cash.app/account/activity';
    await pupp.goto(url);
    log(`going to ${url}`);    

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

    await sleep(1000);
    let prevLen = 0;
    await waitElement({
        message: 'Waiting for transactions',
        waitSeconds: 60,
        action: async () => {
            const activityList = await pupp.findAllByCss('.activity-list-content');
            if (!activityList || !activityList.length) {
                log(`Waiting for activity ${new Date().toISOString()}`);
                throw 'no activity';
            }
            
            if (prevLen != activityList.length) {
                const pl = prevLen;
                prevLen = activityList.length;
                throw {
                    message: `len different ${pl} ${activityList.length}`
                }
            }
        }
    });
    const activityList = await pupp.findAllByCss('.activity-list-content');
    console.log(`activityList len = ${activityList.length}`);
    const rawResults = await Promise.map(activityList, async activity => {
        const origData = [await activity.$('.title'),
        await activity.$('.subtitle'),
        await activity.$('.date'),
        await activity.$('.action-amount span'),
        ];
        const cleaned = await Promise.map(origData, d => pupp.getElementText(d)).map(cleanHtml)
            .map(r=>r.trim());
        const [name, notes, dateRaw, amount] = cleaned;
        const source = 'cashapp';
        let date = dateRaw;
        if (dateRaw.match(/^[a-zA-Z]+$/)) {
            date = moment().day(dateRaw);
            if (date.isAfter(moment())) {
                date = date.add(-7, 'day');
            }
        } else if (dateRaw.match(/^[a-zA-Z]+[ ]+\d+$/))
        {
            date = moment(dateRaw, 'MMM DD');
        } else {
            date = moment(dateRaw, 'MMM DD, YYYY');
        }
        date = date.format('YYYY-MM-DD');
        console.log(`name=${name} notes=${notes} date=${dateRaw} ${date} amount=${amount}`)
        if (amount === 'GET IT NOW') return null;
        return {
            name,
            notes,
            date,
            amount,
            source,
        }
    }, {concurrency: 5});
    
    //log('freeForming');
    //await freeForm(pupp);
    //.activity-list .activity-list-item .activity-list-content
    return rawResults.filter(x=>x);
}

module.exports = {
    process,
}
