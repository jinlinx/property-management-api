const creds = require('../creds.json');
const fs = require('fs');
const submit = require('./lib/submit');
//const https = require('https');
const processor = require('./processors/puppaypal');
async function getPaypal(creds, opts = {
    log: x=>console.log(x)
}) {       
    const trans = await processor.process(creds, opts);
    //fs.writeFileSync('outputData/paypal.json', JSON.stringify(trans));
    return await submit.submit(trans, opts);
}

module.exports = {
    doPaypal: opts=>getPaypal(creds.paypal, opts)
}