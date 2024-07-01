import * as gen from './processors/procAndCompGeneric';
import creds from '../creds.json';
import { ILog, IActualPuppConfig } from './processors/genProc'
import { doJob } from './processors/chase';

import * as fs from 'fs';
import moment from 'moment';

function csvToJson(res: string): gen.IHouseData[] {
    const sliced = res.split('\n').slice(1);
    //opts.log('slied', sliced);
    const mapped = sliced.map(r => {
        if (!r) return;
        const ary = r.split(',');
        return {
            date: moment(ary[0]).format('YYYY-MM-DD'),
            payee: ary[2],
            category: ary[3],
            type: ary[4],
            amount: -parseFloat(ary[5]),
        }
    }).filter(m => m) as gen.IHouseData[];
    return mapped;
}

export async function processChaseX(log: ILog, puppConfig: IActualPuppConfig, timeout?: number, debug?: boolean) {

    const contentStr = fs.readFileSync('load a downloaded csv file').toString();
    
    const newData = csvToJson(contentStr);
    const opts = {
        creds: creds.chase_xie, log, doJob, puppConfig,
        timeout, debug,
    };
    const res = await gen.useGenDataToCompareUpdateSheet(opts, newData, true);

    //await gen.getGenDataAndCompareUpdateSheet(opts);
}