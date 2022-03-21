import { getTokenFromCode, getClientCredsByEnv } from '@gzhangx/googleapi'
import { Request, Response } from 'restify'


function getCreds() {
    const creds = getClientCredsByEnv('gzperm');
    return creds;
}
export async function getToken(req: Request, res: Response): Promise<void> {
    const { code, redirectUrl } = (req.body as any)as {
        code: string;
        redirectUrl: string;
    };
    const creds = getCreds();
    console.log(`creating code for ${code} redir=${redirectUrl}`);
    const tk = await getTokenFromCode(creds, code, redirectUrl).catch(err => {
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