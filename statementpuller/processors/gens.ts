import moment from 'moment';
//const csvParse = require('csv-parse/sync');
//const axios = require('axios');
const { sleep, waitElement, } = require('../lib/util');

import vm from 'vm';
import { IPuppOpts, ILog } from './genProc';
import { IPuppWrapper } from '../lib/chromPupp';
import { ElementHandle } from 'puppeteer';
import fs from 'fs';

export interface IGenDownloadFileRet {
    date: string;
    reference: string;
    payee: string;
    amount: number;
    category: string;
    processor: string;
}


export async function loopDebug(pupp: IPuppWrapper, opts: IPuppOpts, elements: ElementHandle<Element>[]) {
    const context = vm.createContext({});
    context.pupp = pupp;
    context.opts = opts;
    context.moment = moment;
    context.elements = elements;
    const TEMP_FILE_NAME = './temp/test.js';
    let lastFileDate = 0;
    while (true) {
        await sleep(2000);
        try {
            if (fs.existsSync(TEMP_FILE_NAME)) {
                const fstate = fs.statSync(TEMP_FILE_NAME);
                const ftime = fstate.mtime.getTime();
                if (ftime == lastFileDate) continue;
                lastFileDate = ftime;
                const runStr = fs.readFileSync('./temp/test.js').toString();
                if (runStr) {
                    opts.log('running');
                    vm.runInContext(runStr, context);
                    opts.log('done running');
                }
            }
        } catch (err) {
            console.log('error happened', err);
        }
    }
}
