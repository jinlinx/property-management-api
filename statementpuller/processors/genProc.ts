const { createPuppeteer } = require('../lib/chromPupp');
export type ILog = (...args: any[]) => void;


const processingStatus = {
    status:'',
}

export interface ICreds {
    userName: string;
    password: string;
    sheetID: string;
    tabName: string; //maintenaceRecords etc
    matchAccountName: string; //cash account
}

export interface IPuppOpts {
    log: ILog;
    creds: ICreds;
    timeout?: number;
}

export type IGenDoJob = (pupp: any, opts: IPuppOpts) => Promise<any>

export interface IPuppExecOpts extends IPuppOpts {
    doJob: IGenDoJob;
}

export async function genProcess(opts: IPuppExecOpts) {    
    const timeout = opts.timeout || 1000 * 60 * 5;
    const pupp = await createPuppeteer();    
    const log = opts.log || ((...x) => console.log(...x));
    const doJob = opts.doJob;
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
            resolve(await doJob(pupp, opts));
            clearTimeout(tout);
        } catch (err: any) {
            log(err.message, err);
            reject(err);
        } finally {
            log('Done', 'done');
            processingStatus.status = '';
            await pupp.browser.close();
            await pupp.close();
        }
    });
}

export const cleanHtml = (str:string) => str.replace(/<!--(.*?)-->/gm, "");
export const cleanSpan = (str:string) => str.replace(/<[/]{0,1}span(.*?)>/gm, '');

