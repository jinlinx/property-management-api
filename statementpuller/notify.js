const paypal = require('./paypal');
const venmo = require('./venmo');
const cashapp = require('./cashapp');
const db = require('../api/lib/db');

const sub = require('./lib/submit');
return sub.sendReadyToImportPaymentEmail().then(r => {
    console.log(r);
});