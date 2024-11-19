const moment = require('moment');
const Promise = require('bluebird');
const { sleep, waitElement    
} = require('../lib/util');

const { genProcess } = require('./genProc');
async function process(creds, opts) {
    return await genProcess(creds, doJob, opts);    
}

async function doJob(pupp, creds, opts) {
    const { log } = opts;
    const saveScreenshoot = () => pupp.screenshot('outputData/test.png');
    await pupp.goto("https://www.paypal.com/us/signin");
    log('going to https://www.paypal.com/us/signin');

    let setEmail = false;
    await waitElement({
        message: 'Waiting page startup',
        //const readyState = await driver.executeScript("return document.readyState");        
        action: async () => {
            await saveScreenshoot();
            if (!setEmail) {
                await pupp.setTextById('email', creds.userName);
                setEmail = true;
            }
            try {
                const next = await pupp.findById('btnNext');
                await next.click();
                await sleep(1000);
            } catch { }
            try {
                await pupp.setTextById('password', creds.password);
            } catch {

            }
            const btn = await pupp.findById('btnLogin');
            log('login click');
            await btn.click();
        }
    });


    await waitElement({
        message: 'Recapture',
        waitSeconds: 60,
        action: async () => {
            await sleep(1000);
            await saveScreenshoot();
            try {
                //recaptcha-checkbox-border
                const recap = await pupp.findById('recaptcha-anchor');
                log('found recapture');
                await recap.click();
                log('clicking recapture');
                await sleep(1000);
            } catch (e) {
                log(e.message);
            }
            await saveScreenshoot();
            const curr = await pupp.findByCSS('.test_balance-tile-currency');            
            const myAcct = await pupp.findById('myaccount-button');
            if (!curr && !myAcct) throw { message: 'not login' }
            if (myAcct) await myAcct.click();
        }
    });

    await sleep(1000);
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
        const name = await pupp.getElementHtml(cont, '.counterparty-text');
        const amountSignData = await cont.$$('.transactionAmount span');
        const sign = await pupp.getElementHtml(amountSignData[0]);
        const amount = await pupp.getElementHtml(amountSignData[sign === '-' ? 2 : 1]);

        const MMMDD = await pupp.getElementHtml(cont, '.relative-time');
        let notes = '';
        try {
            notes = await pupp.getElementHtml(cont, '.notes-text');
        } catch { }
        const transactionType = await pupp.getElementHtml(cont, '.transactionType');
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
