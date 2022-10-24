const creds = require('../creds.json');
const fs = require('fs');
//const https = require('https');
import * as processor from './processors/boa';
import * as gsSheet from './lib/gsheet';
import moment from 'moment';
export async function getBoaDataAndCompareUpdateSheet(creds: processor.ICreds, log: processor.ILog) {
    const newData = await processor.processInner(creds, log);
    log('Load sheet data')    
    const dbData = await loadSheetData(creds);    
    log('Loaded sheet data')
    const res = doBoaDataCmp(dbData, newData).filter(m => !m.matchedTo).map(m => m.data).filter(m => m.date !== 'Invalid date');
    const appendData = res.map(m => {
        return [m.date, 'card', -(m.amount || 0), '', 'card', m.payee, m.reference || '']
    });
    log(`Appending ${JSON.stringify(appendData)}`);
    await appendSheet(`${creds.tabName}!A:G`, appendData)
    return res;
}


export async function loadSheetData(prms: processor.ICreds) {
    const dbData = await gsSheet.loadSheetData({
        sheetId: prms.sheetID,
        lastCol: 'H',
        tabName: prms.tabName,
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
                        if (isNaN(amount)) {
                            amount = 0;
                        }
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
                    reference: d[7],
                }
            });
            return data;
        },
    });
    return dbData as gsSheet.IHouseData[];
}

export const doBoaDataCmp = gsSheet.doBoaDataCmp;
export async function appendSheet(range: string, data: any) {
    return gsSheet.appendSheetData(process.env.DBSHEET_ID || 'NOID', range, data);
}
//module.exports = {
    //getBoaXe: (opts:any) => getBoaXe(creds.boaXie, opts),
    //loadSheetData,
    //doBoaDataCmp,
    //appendSheet,
//}

