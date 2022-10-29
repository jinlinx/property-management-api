import moment from 'moment';
//const csvParse = require('csv-parse/sync');
//const axios = require('axios');
import { sleep, } from '../lib/util';
import axios from 'axios';

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
    const context = {
        pupp,
        opts,
        moment,
        axios,
        elements,
        sleep,
        opers: {
            sleep,
            axios,
        },
        prepareFileClickInterception,
    }
    vm.createContext(context);    
    const TEMP_FILE_NAME = './temp/test.js';
    let lastFileDate = 0;
    while (true) {
        await sleep(1000);
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

export async function prepareFileClickInterception(pupp: IPuppWrapper, urlToMatch: string, opts: IPuppOpts) {
    await pupp.page.setRequestInterception(true);
    const fileResults = {
        wait: null,
        resolve: () => { throw 'should not happen' },
        csvStr: '',
    } as {
        wait: Promise<string> | null;
        resolve: ((data: any) => string);
        csvStr: string;
    };
    pupp.page.on('request', async (interceptedRequest: any) => {
        opts.log('got request', interceptedRequest.url());        
        if (interceptedRequest.url().match(new RegExp(urlToMatch))) {
            opts.log('got request AND MATCHED!!!!!!!!!!!!!!!');
            const cookies = await pupp.page.cookies();
            opts.log('headers', interceptedRequest.headers())
            //console.log('cookies', cookies);
            //console.log('cookies', interceptedRequest.method());
            const headers = { ...interceptedRequest.headers() }
            headers.cookie = cookies.map((ck: any) => ck.name + '=' + ck.value).join(';');
            const rsp = await axios.get(interceptedRequest.url(), {
                headers,
            });
            opts.log('rsp', rsp.data, rsp.data.length)
            fileResults.csvStr = rsp.data;
            fileResults.resolve(rsp.data);
            return interceptedRequest.abort();
        }
        opts.log('got request AND continue');
        try {
            interceptedRequest.continue();
        } catch (err: any) {
            opts.log('continue ERROR ' + err.message);
        }
        //interceptedRequest.abort();     //stop intercepting requests
        //resolve(interceptedRequest);
    });

    fileResults.wait = new Promise<string>(resolve => {
        fileResults.resolve = resolve as ((d: any) => string);
    });
    return fileResults.wait;
}
