import {Request, Response} from 'restify'
import { doQuery } from '../lib/db';
import { createUserToken } from '../util/pauth'
import {uniq} from 'lodash'
interface ILoginParms {
    username: string;
    password: string;
}

interface IOwnerInfo {
    ownerID: number;
    ownerName: string;
    username: string;
    password: string;

}

function cleanId(id: number): number {
    return parseInt(id as any);
}
export async function login(req: Request, res:Response) : Promise<void> {
    const {username, password} = (req.body || {}) as ILoginParms;
    const users = await doQuery(`select * from ownerInfo where username=?`, [username]) as IOwnerInfo[];
    if (users && users.length) {
        const user = users[0];
        const id = user.ownerID;
        if (users[0].password === password) {
            const subUsers = await doQuery(`select * from ownerInfo where parentID=?`, [id]) as IOwnerInfo[];
            const ownerPCodes = uniq([id].concat(subUsers.map(u => u.ownerID))).map(cleanId);
            const token = createUserToken({
                code: id,
                pmInfo: {
                    ownerPCodes,
                },
                username,
            });
            return res.send({
                id: id,
                exp: 1,
                ownerPCodes,
                token,
            });
        }
        return res.send({ error: 'bad password' });
    } else {
        res.send({error:'no such user'});
    }
}