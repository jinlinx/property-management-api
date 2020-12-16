const paypal = require('./paypal');
const venmo = require('./venmo');
const db = require('../api/lib/db');

//return venmo.doVenmo().catch(err => console.log(err))

return paypal.doPaypal().catch(err => console.log(err)).then(() => console.log('done'))
    .then(() => {
        db.conn.end();
});
