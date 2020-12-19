const creds = require('../creds.json');
const moment = require('moment');
const fs = require('fs');
//const https = require('https');
const submit = require('./lib/submit');
const processor = require('./processors/puppvenmo');

//return submitTest();

async function getVenmo(opts = { log: x => console.log(x) }) {
    const log = opts.log;
    return processor.process(creds.venmo, opts).then(async trans => {
        //fs.writeFileSync('outputData/venmo.json', JSON.stringify(trans, null, 2));
        log('done');
        return await submit.submit(trans,opts);        
    });
}


//function submitTest() {
//    const datas = JSON.parse(fs.readFileSync('outputData/venmo.json'));
//    return submit.submit(datas);
//}

module.exports = {
    doVenmo: getVenmo,
}