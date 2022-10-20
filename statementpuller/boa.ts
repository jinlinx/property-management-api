const creds = require('../creds.json');
const fs = require('fs');
const { readOneLine } = require('./lib/util');
//const https = require('https');
const processor = require('./processors/boa');
import * as gsSheet from './lib/gsheet';
import moment from 'moment';
export async function getBoaXe(creds: any, opts = {
    log: (x:any) => console.log(x),
    getCode: () => readOneLine('Pleae input code'),
}) {
    const trans = await processor.process(creds, opts);
    //fs.writeFileSync('outputData/paypal.json', JSON.stringify(trans));
    //return await submit.submit(trans, opts);
    return trans
}


export async function loadSheetData() {
    const dbData = await gsSheet.loadSheetData({
        sheetId: process.env.DBSHEET_ID || 'NOID',
        lastCol: 'H',
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
module.exports = {
    getBoaXe: (opts:any) => getBoaXe(creds.boaXie, opts),
    loadSheetData,
    doBoaDataCmp,
    appendSheet,
}

