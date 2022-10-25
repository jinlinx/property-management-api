import * as gen from './processors/procAndCompGeneric';
import creds from '../creds.json';
import { ILog } from './processors/genProc'
import { doJob } from './processors/boa';
export async function processBoaX(log: ILog, puppConfig: any) {
    await gen.getGenDataAndCompareUpdateSheet({
        creds: creds.boaXie, log, doJob, puppConfig,
    });
}