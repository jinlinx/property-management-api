import {Request, Response} from 'restify'
import db, { doQuery } from '../lib/db';

interface ILoginParms {
    username: string;
    password: string;
}


export async function login(req: Request, res:Response) {
    const {username, password} = (req.body || {}) as ILoginParms;
    const users = await doQuery(`select * from ownerInfo where username=?`, [username]);
    if (users && users.length) {
        if (users[0].password === password) {

        }
    } else {
        res.send({error:'no such user'});
    }
}