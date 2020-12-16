const paypal = require('./paypal');
const venmo = require('./venmo');
const db = require('../api/lib/db');

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
