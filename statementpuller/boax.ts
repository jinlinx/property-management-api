import * as boax from './processors/procAndCompGeneric';
import creds from '../creds.json';
import { ILog } from './processors/genProc'
import { doJob } from './processors/boa';
export async function processBoaX(log: ILog) {
    await boax.getGenDataAndCompareUpdateSheet({
        creds: creds.boaXie, log, doJob
    });
}