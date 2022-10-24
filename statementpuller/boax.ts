import * as boax from './processors/boaGeneric';
import creds from '../creds.json';
import { ILog } from './lib/utils';
export async function processBoaX(log: ILog) {    
    await boax.getBoaDataAndCompareUpdateSheet(creds.boaXie, log);    
}