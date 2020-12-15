const paypal = require('./paypal');


paypal.doPaypal().catch(err => {
    console.log(err);
}).then(() => {
    console.log('done');
})