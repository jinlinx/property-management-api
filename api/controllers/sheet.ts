import { gsAccount } from '@gzhangx/googleapi'
import { Request, Response } from 'restify'
const { get, omit,pick } = require('lodash');
import { getUserAuth, IUserAuth } from '../util/pauth'
import * as fs from 'fs';

import { doSqlGetInternal } from './sql';
export async function getSheetClient(req: Request) {
    /*
    const auth = getUserAuth(req);
    if (!auth) {
        const message = 'not authorized';
        throw ({
            message,
            error: message,
        })
    }
    */
    const fname = process.env['google_gzperm_svc_account_file'] || 'nofile';
    const key = JSON.parse(fs.readFileSync(fname).toString()) as gsAccount.IServiceAccountCreds;
    const client = gsAccount.getClient(key);
    console.log('WARNING unsecured, todo add back security');
    return client;
/*
    const tokenRes = await doSqlGetInternal(auth, {
        table: 'ownerInfo',
        fields: ['googleToken'],
        whereArray: [{
            field: 'ownerID',
            op: '=',
            val: auth.code,
        }]
    });
    console.log(tokenRes);

    cliInfo.refresh_token = tokenRes.rows[0].googleToken;
    const client = await google.getClient(cliInfo);
    return client;
    */
}

function cleanError(err: any) {
    const config = pick(err, 'config.headers', 'config.url', 'config.method');
    return Object.assign({}, omit(err, ['request', 'response.request', 'config']), config);
}
async function doGet(req: Request, res: Response) {
    try {
        const auth = getUserAuth(req);
        if (!auth) {
            const message = 'not authorized';
            return res.json({
                message,
                error: message,
            })
        }
        
        const {  op, id, range } = req.params;        
        const data = req.body;
                
        const client = await getSheetClient(req);
        if (!client) {
            const message = `clinet  not found`;
            console.log(message);
            return res.send(500, {
                message,
            });
        }
        const sheet = client.getSheetOps(id);
        let rsp = null;
        if (op === 'read') {
            rsp = await sheet.read(range);
        } else if (op === 'append') {
            rsp = await sheet.append(range, data); //`'Sheet1'!A1:B2`, [['data']]
        } else if (op === 'batch') {
            rsp = await sheet.doBatchUpdate(data);
        } else {
            res.send(400, { message: `Not supported operation ${op}` });
        }
        return res.json(rsp);
    } catch (err: any) {
        const rspErr = get(err, 'response.text') || get(err, 'response.data.error');
        console.log('sheet.doGet error, params, rspErr, errors', req.params, rspErr, err.errors);
        console.log('sheet.doGet error', cleanError(err));
        res.send(422, {
            id: req.params.id,
            message: err.message,
            errors: err.errors,
            rspErr,
        });
    }
}

async function readMaintenanceRecord(req: Request, res: Response) {
    try {        
        const client = await getSheetClient(req);
        if (!client) {
            const message = `clinet  not found`;
            console.log(message);
            return res.send(500, {
                message,
            });
        }
        const sheetId = process.env.maintenanceRecordGSheetId || 'NOmaintenanceRecordGSheetId';

        const sheetName = req.query.sheetId || 'MaintainessRecord';
        console.log(`SheetId ${sheetId} name =${sheetName}`);
        const sheet = client.getSheetOps(sheetId);
        const rsp = await sheet.read(sheetName);
        console.log('rsp',rsp)
        return res.json(rsp);
    } catch (err: any) {
        const rspErr = get(err, 'response.text') || get(err, 'response.data.error');
        console.log('sheet.doGet error, params, rspErr, errors', req.params, rspErr, err.errors);
        console.log('sheet.doGet error', cleanError(err));
        res.send(422, {
            id: req.params.id,
            message: err.message,
            errors: err.errors,
            rspErr,
        });
    }
}

module.exports = {
    doGet,
    readMaintenanceRecord,
}