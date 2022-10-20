import { google } from '@gzhangx/googleapi'
//import moment from 'moment';
//import fs from 'fs';

import * as credentials from '../../credentials.json';

export async function getSheetOps(id: string) {
    let creds = google.getClientCredsByEnv('gzperm');
    let client = null;
    if (!creds.client_id) {
        creds = credentials.googleSheet.gzprem;
        client = await google.getClient(creds);
    } else {
        client = await google.getClientByEnv('gzperm');
    }
    return client.getSheetOps(id);    
}


import * as dataMatcher from './dataMatcher';

interface IProcessOpts {
    sheetId: string;
    tabName: string;
    lastCol: string;
    processData: (data: any[])=>any[];
}

export async function loadSheetData(opts: IProcessOpts) {
    const sheet = await getSheetOps(opts.sheetId);    
    const info = await sheet.sheetInfo();    
    const rowCount = info.find(i => i.title === opts.tabName)?.rowCount;
    if (!rowCount) return [];
    const dataRaw = await sheet.read(`${opts.tabName}!A1:${opts.lastCol}${rowCount}`);
    const data = opts.processData(dataRaw.values);
    return data;
}


export interface IHouseData {
    date: string;
    amount: number | null;
    house?: string;
    reference?: string;
}

function getDataComper(dbData: IHouseData[], newData: IHouseData[]) {
    const cmp: dataMatcher.ICompareOpts<IHouseData> = {
        dbData,
        newData,
        computeDiff: (db, n) => {
            return db.reference === n.reference? 1:0;
        },
        getPrimaryKey: (data, who) =>{
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

//doBoaDataCmp();
/*
import testData from '../../temp/cmpData.json';
import debugInfo from '../../temp/inputs.json';
import newData from '../../temp/out.json'
import { INSPECT_MAX_BYTES } from 'buffer';
async function doTestInitialSaveData() {
    const dbData = await loadSheetData({
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
    const cmp = {} as dataMatcher.ICompareOpts<IHouseData>;
    cmp.dbData = dbData;    
    cmp.newData = newData;
    fs.writeFileSync('./temp/cmpData.json', JSON.stringify(cmp,null,2))

}
*/

export async function appendSheetData(sheetId: string, range:string, data: any) {
    const sheet = await getSheetOps(sheetId);
    await sheet.append(range, data);
}

