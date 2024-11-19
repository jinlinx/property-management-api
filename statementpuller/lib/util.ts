const bluebird = require('bluebird');
const readline = require('readline');

//const { createFireFoxDriver, By } = require('./createDriver');
//const driver = createFireFoxDriver();

interface IWaitElementPrms {
    message: string;
    action: (message: string, i: number) => Promise<void>;
    waitSeconds?: number;
    sleepInterval?: number;
    debug?: boolean;
}
export async function waitElement({
    message,
    action,
    waitSeconds = 60,
    sleepInterval = 1000,
    debug = true,
}: IWaitElementPrms) {
    if (debug) console.log(`Starting ${message}`);
    const waitLoopCnt = waitSeconds * 1000 / sleepInterval;
    const errors = [];
    for (let i = 0; i < waitLoopCnt; i++) {
        //const readyState = await driver.executeScript("return document.readyState");        
        try {
            return await action(message, i);
        } catch (err: any) {
            errors.push(err.message);
            if (debug) console.log(err.message);
            await sleep(sleepInterval);
        }
    }
    throw {
        message: `Timeout ${message}: ${errors[0]}`,
        errors,
    }
}

export async function sleep(ms: number) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });    
}

export function readOneLine(prompt: string) {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(prompt, (answer: any) => {
            resolve(answer);
            rl.close();
        });
    });
}



export const pmap1 = (itms: any[], action: any, concurrency: number) => bluebird.map(itms, action, { concurrency });
