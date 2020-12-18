const paypal = require('./paypal');
const venmo = require('./venmo');
const db = require('../api/lib/db');
const { submit, matchImports } = require('./lib/submit');

//const fs = require('fs');
//const submit = require('./lib/submit');
//trans = JSON.parse(fs.readFileSync('outputData/paypal.json'));
//return submit.submit(trans).then(() => db.conn.end()).catch(err => {
//    console.log(err);
//    db.conn.end()
//})
return matchImports();


async function doAll() {
    try {
        const venmoRes = await venmo.doVenmo();

        const paypalRes = await paypal.doPaypal();
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
