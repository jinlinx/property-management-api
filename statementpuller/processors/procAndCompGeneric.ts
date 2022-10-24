
import * as gsSheet from '../lib/gsheet';
import moment from 'moment';
import * as dataMatcher from '../lib/dataMatcher';
import {
    ICreds,
    ILog,
    genProcess,
    IPuppExecOpts,
} from './genProc';



export interface IDateAmount {
    date: string;
    reference: string;    
    amount: number;
}

export async function getGenDataAndCompareUpdateSheet(opts: IPuppExecOpts) {
    const log = opts.log;
    const creds = opts.creds;
    const newData = await genProcess(opts) as IHouseData[];    
    log('Load sheet data')    
    const dbData = await loadSheetData(creds);    
    log('Loaded sheet data')
    const res = doBoaDataCmp(dbData, newData).filter(m => !m.matchedTo).map(m => m.data).filter(m => m.date !== 'Invalid date');
    const appendData = res.map(m => {
        return [m.date, 'Card', -(m.amount || 0), '', 'Supplies', m.payee, m.reference || '']
    });
    log(`Appending ${JSON.stringify(appendData)}`);
    await appendSheet(creds.sheetID, `${creds.tabName}!A:G`, appendData)
    return res;
}


export interface IHouseData {
    date: string;
    amount: number | null;
    house?: string;
    reference?: string;
    payee?: string; //only in bank
}

function getDataComper(dbData: IHouseData[], newData: IHouseData[]) {
    const cmp: dataMatcher.ICompareOpts<IHouseData> = {
        dbData,
        newData,
        computeDiff: (db, n) => {
            return db.reference === n.reference ? 1 : 0;
        },
        getPrimaryKey: (data, who) => {
            if (who === 'db') {
                //"date": "2020-08-30",
                //"desc": "epot",
                //"amount": 15.96,
                //"house": "xxxx",
                //"cat": "Supplies"
                return `${data.date}-${data.amount}-${data.house || ''}`;
            } else { //if (who === 'new')
                //"date": "Invalid date",
                //"reference": "Reference Number",
                //"payee": "Payee",
                //"address": "Address",
                //amount
                return `${data.date}-${-(data.amount || 0)}-`;
            }
        },
    };
    return cmp;
}

export function doBoaDataCmp(dbData: IHouseData[], newData: IHouseData[]) {
    const cdata = getDataComper(dbData, newData);
    return dataMatcher.compareAndMatchData(cdata);
}

export async function loadSheetData(prms: ICreds) {
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
    return dbData as IHouseData[];
}

export async function appendSheet(sheetId: string, range: string, data: any) {
    return gsSheet.appendSheetData(sheetId, range, data);
}
//module.exports = {
    //getBoaXe: (opts:any) => getBoaXe(creds.boaXie, opts),
    //loadSheetData,
    //doBoaDataCmp,
    //appendSheet,
//}

