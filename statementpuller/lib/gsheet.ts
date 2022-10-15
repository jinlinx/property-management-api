import { google } from '@gzhangx/googleapi'
import { set, get, keys } from 'lodash';
import moment from 'moment';

const credentials = require('../../credentials.json');

export async function getSheetOps(id: string) {
    let creds = google.getClientCredsByEnv('gzperm');
    let client = null;
    if (!creds.client_id) {
        creds = credentials.googleSheet.gzperm;
        client = await google.getClient(creds);
    } else {
        client = await google.getClientByEnv('gzperm');
    }
    console.log('got cli , return sheet ops')
    return client.getSheetOps(id);    
}


interface ICompareOpts {
    dbData: any[];
    newData: any[];
    keyDim: number;
    getKeyFromDbData: (data: any, dim: number) => string;
    getKeyFromNewData: (data: any, dim: number) => string;
}
export function compareData(opts: ICompareOpts) {
    const existingKeys = opts.dbData.reduce((acc, data) => {
        const keySet: string[] = [];
        for (let i = 0; i < opts.keyDim; i++) {
            keySet.push(opts.getKeyFromDbData(data, i));
        }
        let ary: any[] = get(acc, keySet);
        if (!ary) {
            ary = [];
            set(acc, keySet, ary);
        }
        ary.push({
            matchedTo: '',
            data,
        });
        return acc;
    }, {});
    
    
}

interface IProcessOpts {
    sheetId: string;
    tabName: string;
    lastCol: string;
    processData: (data: any[])=>any[];
}

async function loadSheetData(opts: IProcessOpts) {
    console.log('here in test, calling get sheet pos');
    const sheet = await getSheetOps(opts.sheetId);
    console.log('here got ops');
    const info = await sheet.sheetInfo();    
    const rowCount = info.find(i => i.title === opts.tabName)?.rowCount;
    if (!rowCount) return;
    const dataRaw = await sheet.read(`${opts.tabName}!A1:${opts.lastCol}${rowCount}`);
    const data = opts.processData(dataRaw.values);
    console.log('here got data', data);
    return data;
}

const debugInfo = require('../../temp/inputs.json');

loadSheetData({
    sheetId: debugInfo.sheetId,
    lastCol: 'G',
    tabName: 'MaintainessRecord',
    processData: dataOrig => {
        const data = dataOrig.slice(1).map(d => {
            let amount = null;
            if (d[2]) {
                const amtStr = d[2].replace(/[\$,]/g, '').trim();
                const matched = amtStr.match(/\((.*)\)/);
                if (matched) {                    
                    amount = -parseFloat(matched[1]);
                } else {                    
                    amount = parseFloat(amtStr);
                }                
            } else {
                amount = 0;
            }
            return {
                date: moment(d[0]).format('YYYY-MM-DD'),
                desc: d[1],
                amount,
                house: d[3],
                cat: d[4],
                worker: d[5],
                comment: d[6],
            }
        });
        return data;
    },    
});