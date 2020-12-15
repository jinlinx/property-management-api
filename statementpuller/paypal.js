const creds = require('../creds.json');
const fs = require('fs');
const submit = require('./lib/submit');
//const https = require('https');
const processor = require('./processors/puppaypal');
async function getPaypal(creds) {    
    const trans = await processor.process(creds);
    //fs.writeFileSync('outputData/paypal.json', JSON.stringify(trans));
    return await submit.submit(trans);
}

module.exports = {
    doPaypal: ()=>getPaypal(creds.paypal)
}