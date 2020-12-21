const creds = require('../creds.json');
const fs = require('fs');
const submit = require('./lib/submit');
const { readOneLine } = require('./lib/util');
//const https = require('https');
const processor = require('./processors/cashapp');
async function getCashApp(creds, opts = {
    log: x => console.log(x),
    getCode: () => readOneLine('Pleae input code'),
}) {
    const trans = await processor.process(creds, opts);
    //fs.writeFileSync('outputData/paypal.json', JSON.stringify(trans));
    //return await submit.submit(trans, opts);
    return trans
}

module.exports = {
    doCashApp: opts => getCashApp(creds.cashapp, opts)
}

getCashApp(creds.cashapp)