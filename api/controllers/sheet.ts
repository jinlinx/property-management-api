import { google } from '@gzhangx/googleapi'
import { IRefresCreds } from '@gzhangx/googleapi/lib/googleApi';
import { Request, Response } from 'restify'
const { get } = require('lodash');
import { getUserAuth, IUserAuth } from '../util/pauth'

import { doSqlGetInternal } from './sql';
export async function getSheetClient(req: Request) {
    const auth = getUserAuth(req);
    if (!auth) {
        const message = 'not authorized';
        throw ({
            message,
            error: message,
        })
    }
    const cliInfo = google.getClientCredsByEnv('gzperm') as IRefresCreds;

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
        console.log('sheet.doGet rspErr',rspErr, err);
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
}