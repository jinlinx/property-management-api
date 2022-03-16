import {Request, Response} from 'restify'
import { doQuery } from '../lib/db';
import { createUserToken } from '../util/pauth'

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
export async function login(req: Request, res:Response) : Promise<void> {
    const {username, password} = (req.body || {}) as ILoginParms;
    const users = await doQuery(`select * from ownerInfo where username=?`, [username]) as IOwnerInfo[];
    if (users && users.length) {
        const user = users[0];
        const id = user.ownerID;
        if (users[0].password === password) {
            const subUsers = await doQuery(`select * from ownerInfo where parentID=?`, [id]) as IOwnerInfo[];
            const token = createUserToken({
                code: id,
                pmInfo: {
                    ownerCodes: [{ ownerID: id, ownerName: user.ownerName }].concat(subUsers.map(u => {
                        return {
                            ownerID: u.ownerID,
                            ownerName: u.ownerName,
                        }
                    })),
                },
                username,
            });
            return res.send({
                id: id,
                exp: 1,
                token,
            });
        }
        return res.send({ error: 'bad password' });
    } else {
        res.send({error:'no such user'});
    }
}