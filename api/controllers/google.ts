
import { google, gsAccount } from '@gzhangx/googleapi'
import { Request, Response } from 'restify'

import { createOrUpdateInternal } from './sql';
import {getUserAuth, IUserAuth } from '../util/pauth'
import { IGClientCreds } from '@gzhangx/googleapi/lib/googleApi';

function getCreds() {
    const creds: gsAccount.IServiceAccountCreds = {} as gsAccount.IServiceAccountCreds;
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
    const client = google.gsAccount.getClient(creds);
    try {
        const tk = await client.getToken();    
        console.log(`saving google token`);

        await createOrUpdateInternal({
            create: false,
            table: 'ownerInfo',
            fields: {
                googleToken: tk,
                ownerID: auth.code.toString(),
            }
        }, auth);        
        console.log(`google.getToken ${tk}`);
        res.send(tk);
    } catch (err) {
        console.log('somethig happened to getting code');
        console.log(err);
    }    
}

export async function getGoogleClientId(req: Request, res: Response) {
    const creds = getCreds();
    return res.send({
        client_id: creds.client_id, 
    });
}
