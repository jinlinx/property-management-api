/*
import { google } from '@gzhangx/googleapi'
import { Request, Response } from 'restify'

import { createOrUpdateInternal } from './sql';
import {getUserAuth, IUserAuth } from '../util/pauth'
import { IServiceAccountCreds } from '@gzhangx/googleapi/lib/google/googleApiServiceAccount';

function getCreds() {
    const creds: IServiceAccountCreds = {};
    return creds;
}
export async function getToken(req: Request, res: Response): Promise<void> {
    const { code, redirectUrl } = (req.body as any)as {
        code: string;
        redirectUrl: string;
    };
    const auth = getUserAuth(req);
    if (!auth) {
      const message = 'not authorized';
      return res.json({
        message,
        error: message,
      })
    }
    const creds = getCreds();
    console.log(`creating code for ${code} redir=${redirectUrl}`);
    const tk = await google.getTokenFromCode(creds, code, redirectUrl).then(async tk => {
        console.log(`saving google token`);

        await createOrUpdateInternal({
            create: false,
            table: 'ownerInfo',
            fields: {
                googleToken: tk.refresh_token,
                ownerID: auth.code.toString(),
            }
        }, auth);
        return tk;
    }).catch(err => {
        console.log('somethig happened to getting code');
        console.log(err);
        return err;
    })
    console.log(`google.getToken ${tk.access_token} ${tk.expires_in} ${tk.scope}`);
    res.send(tk);
}

export async function getGoogleClientId(req: Request, res: Response) {
    const creds = getCreds();
    return res.send({
        client_id: creds.client_id, 
    });
}
*/