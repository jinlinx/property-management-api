import { getTokenFromCode, getClientCredsByEnv } from '@gzhangx/googleapi'
import { Request, Response } from 'restify'

export async function getToken(req: Request, res: Response): Promise<void> {
    const { code, redirectUrl } = (req.body as any)as {
        code: string;
        redirectUrl: string;
    };
    const creds = getClientCredsByEnv('gzperm');    
    console.log(`creating code for ${code} redir=${redirectUrl}`);
    const tk = await getTokenFromCode(creds, code, redirectUrl);
    console.log(`google.getToken ${tk.access_token} ${tk.expires_in} ${tk.scope}`);
    res.send(tk);
}