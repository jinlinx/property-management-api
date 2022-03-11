import { Server, Request } from 'restify'
import { signJwt, verifyJwt } from './jwt';

export interface IUserAuth {
    username: string;
    code: string;
    exp: number;
    pmInfo: {
        ownerCodes: number[];
    }
}

export function getUserAuth(req: Request): (IUserAuth | null) {
    const auth = req.authorization as any;
    if (!auth) return null;
    return auth.info as IUserAuth;
}

export function initAuth(server: Server) {
    server.use((req, res, next) => {
        const auth = req.headers.authorization;
        if (auth && auth.match(/^Bearer /i)) {            
            const tk = auth.substring(7);
            console.log(tk);
            try {
                const vres = verifyJwt(tk) as IUserAuth;
                const rauth = {
                    credentials: vres.code,
                    scheme: 'Bearer',
                    basic: {
                        username: vres.username,
                        password: '',
                    },
                    info: vres,
                };
                req.authorization = rauth;
            } catch (err) {
                console.log(err);
            }
            const jj = signJwt({
                test: 1,
                dd: 2,
                code: 'testcode',
                expiresIn: '1d',
            });
            console.log(jj);            
        }        
        //jwt.verify()
        return next();
    });
}