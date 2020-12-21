const { createPuppeteer } = require('../lib/chromPupp');
const processingStatus = {
    status:'',
}
async function genProcess(creds, doJob, opts = {
    timeout: 1000 * 60 * 5,
    log: x => console.log(x),
}) {    
    const timeout = opts.timeout || 1000 * 60 * 5;
    const pupp = await createPuppeteer();
    const log = opts.log;
    if (processingStatus.status) {
        log('Processing inprogress, aborting');
        throw new Error('Processing in-progress');
    }
    processingStatus.status = 'Processing';
    return new Promise(async (resolve, reject) => {
        try {
            const tout = setTimeout(async () => {
                log('Timeout');
                reject(new Error('Timeout'));
                processingStatus.status = '';
                await pupp.close();
            }, timeout);
            resolve(await doJob(pupp, creds, opts));
            clearTimeout(tout);
        } catch (err) {
            log(err.message, err);
            reject(err);
        } finally {
            log('Done', 'done');
            processingStatus.status = '';
            await pupp.close();
        }
    });
}

module.exports = {
    genProcess,
    processingStatus,
}