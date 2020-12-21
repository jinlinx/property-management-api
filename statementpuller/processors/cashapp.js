const moment = require('moment');
const Promise = require('bluebird');
const { sleep, waitElement
} = require('../lib/util');

const { genProcess } = require('./genProc');
async function process(creds, opts) {
    return await genProcess(creds, doJob, opts);
}

async function doJob(pupp, creds, opts) {
    const { log, getCode } = opts;
    const saveScreenshoot = () => pupp.screenshot('outputData/test.png');
    const url = 'https://cash.app/login?return_to=account.index';
    //const url = 'http://localhost:3001';
    await pupp.goto(url);
    log(`going to ${url}`);

    let setEmail = false;
    await waitElement({
        message: 'Waiting page startup',
        //const readyState = await driver.executeScript("return document.readyState");        
        action: async () => {
            await saveScreenshoot();
            
            await pupp.setTextById('alias', creds.userName);
            
            
            const next = await pupp.findByCSS('#ember386 button');
            await next.click();
            await sleep(1000);                    
        }
    });


    const codeRes = await waitElement({
        message: 'Code',
        waitSeconds: 60,
        action: async () => {
            await sleep(1000);
            await saveScreenshoot();
            await pupp.findById('code')
            let code = '';
            try {
                code = await getCode();
            } catch (err) {
                return err;
            }
            
            //recaptcha-checkbox-border
            await pupp.setTextById('code', code);
            log(`set code ${code}`);
            const btn = await pupp.findByCSS('#ember542 button');
            btn.click();
            log('clicking code submit button');
            await sleep(1000);
            
        }
    });
    if (codeRes && codeRes.message) {
        throw codeRes;
    }

    await waitElement({
        message: 'Confirm Selection',
        waitSeconds: 60,
        action: async () => {
            await sleep(1000);
            const btns = await pupp.findAllByCss('.selection-option-list a.button.theme-button');
            console.log(btns);
            console.log(btns.length);
            btns[1].click();
        }
    })

    await sleep(10000);
    const btnActivities = await pupp.findById('header-activity');
    await btnActivities.click();
    log('header activity click');
    await waitElement({
        message: 'Wait transction page',
        waitSeconds: 60,
        action: async () => {
            await sleep(1000);
            await saveScreenshoot();
            const found = await pupp.findByCSS('.transactionDescriptionContainer');
            log('waiting transaction description')
            if (!found) throw { message: 'no desc' }
        }
    });
    await saveScreenshoot();

    const containers = await pupp.findAllByCss('.transactionDescriptionContainer');
    log(`containers=${containers.length}`);

    const paypalTrans = await Promise.map(containers, async cont => {
        /*
        const desc = await cont.findElements(By.css('.transactionDescription'));
        while (true) {
            try {
                const line = await readOneLine('give me a line');
                console.log(line);
                const divs = await cont.findElements(By.css(line));
                await Promise.map(divs, async (div,ind) => {
                    const value = await div.getAttribute('innerHTML');
                    console.log(ind + ' val=' + value);
                }, { concurrency: 1 });                
                
            } catch (e) {
                console.log(e.message)
            }
        }
*/
        const name = await pupp.getElementText(cont, '.counterparty-text');
        const amountSignData = await cont.$$('.transactionAmount span');
        const sign = await pupp.getElementText(amountSignData[0]);
        const amount = await pupp.getElementText(amountSignData[sign === '-' ? 2 : 1]);

        const MMMDD = await pupp.getElementText(cont, '.relative-time');
        let notes = '';
        try {
            notes = await pupp.getElementText(cont, '.notes-text');
        } catch { }
        const transactionType = await pupp.getElementText(cont, '.transactionType');
        const parsedDate = moment(MMMDD, 'MMM D');
        if (parsedDate.isAfter(moment())) {
            parsedDate.add(-11, 'years');
        }
        const formatted = parsedDate.format('YYYY-MM-DD');
        log(`${transactionType} ${sign} ${amount} name=${name} notes=${notes} ${formatted}`);
        return {
            transactionType,
            sign,
            amount: sign + amount.replace(/[$]/, '').trim().replace(/,/g, ''),
            name,
            notes,
            date: formatted,
            source: 'paypal',
        }
    }, { concurrency: 1 });

    return paypalTrans;
}

module.exports = {
    process,
}
