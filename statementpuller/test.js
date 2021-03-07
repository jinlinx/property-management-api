const paypal = require('./paypal');
const venmo = require('./venmo');
const cashapp = require('./cashapp');
const db = require('../api/lib/db');

//return cashapp.doCashApp().then(r => { console.log(r) });
return venmo.doVenmo({
    log: s => console.log(s),
    daysOff: 120,
}).then(r => { console.log(r) });
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

async function doAll() {
    try {
        const venmoRes = await venmo.doVenmo();
        await venmo.doVenmo({
            log: s => console.log(s),
            daysOff: 120,
        }).then(r => { console.log(r) });

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

doAll();
