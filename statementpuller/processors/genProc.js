const { createPuppeteer } = require('../lib/chromPupp');
async function genProcess(creds, doJob, opts = {
    timeout: 1000 * 60 * 5,
    log: x => console.log(x),
}) {
    const timeout = opts.timeout || 1000 * 60 * 5;
    const pupp = await createPuppeteer();
    const log = opts.log;
    return new Promise(async (resolve, reject) => {
        try {
            const tout = setTimeout(async () => {
                log('Timeout');
                reject(new Error('Timeout'));
                await pupp.close();
            }, timeout);
            resolve(await doJob(pupp, creds, opts));
            clearTimeout(tout);
        } catch (err) {
            log(err.message, err);
            reject(err);
        } finally {
            log('Done', 'done');
            await pupp.close();
        }
    });
}

module.exports = {
    genProcess,
}