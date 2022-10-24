import * as boax from './processors/procGeneric';
import creds from '../creds.json';
import { ILog } from './lib/utils';
import { processInner } from './processors/boa';
export async function processBoaX(log: ILog) {    
    await boax.getBoaDataAndCompareUpdateSheet(creds.boaXie, log, processInner);    
}