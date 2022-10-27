//const paypal = require('./paypal');
//const venmo = require('./venmo');
//const cashapp = require('./cashapp');
//const db = require('../api/lib/db');
const boax = require('./boax');
const chasex = require('./chasex');
const fs = require('fs');

//const sub = require('./lib/submit');
//return sub.sendReadyToImportPaymentEmail(); //comment out for ts
//return cashapp.doCashApp().then(r => { console.log(r) });
//return venmo.doVenmo({
//    log: s => console.log(s),
//    daysOff: 120,
//}).then(r => { console.log(r) });
/*const fs = require('fs');
const submit = require('./lib/submit');
return submit.matchImports().then(() => db.conn.end());
trans = JSON.parse(fs.readFileSync('outputData/paypal.json'));
return submit.submit(trans).then(async () => {
    await submit.matchImports();
    await db.conn.end();
}).catch(err => {
    console.log(err);
    db.conn.end()
})
*/

test(false,true);

const stdPrms = [s => {
    console.log(`==>${s}`);
}, {
    defaultViewport: {
        width: 1224,
        height: 768,
        isMobile: false,
    },
    headless: false,
}, 1000 * 60 * 120];
async function test() {
    try {
        
        await chasex.processChaseX(...stdPrms);
        return;
        return await boax.processBoaX(...stdPrms)
    } catch (err) {
        console.log(err);
    }
}



async function doAll() {
    try {
        const venmoRes = await venmo.doVenmo();
        for (let i = 0; i < 10; i++) {
            console.log('doing venmo for ' + (i * 90));
            const rr= await venmo.doVenmo({
                log: s => console.log(s),
                daysOff: i*59,
            });
            if (rr.allRes.length === 0) break;
            console.log(`${rr.allRes.length}`);
        }

        const paypalRes = await paypal.doPaypal();
        await cashapp.doCashApp();
        return {
            venmoRes,
            paypalRes,
        }
    } catch (err) {
        console.log(err);
        return err;
    } finally {
        db.conn.end();
    }
}

//doAll();
