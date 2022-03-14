import { Server, Request } from 'restify'
import { signJwt, verifyJwt } from './jwt';
import { IUserAuth } from '../models/types';
export { IUserAuth };

export function getUserAuth(req: Request): (IUserAuth | null) {
    const auth = req.authorization as any;
    if (!auth) return null;
    return auth.info as IUserAuth;
}

export function createUserToken(usr: IUserAuth): string {
    return signJwt({
        ...usr,
        expiresIn: '1d',
    });
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
                    credentials: tk,
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
        }        
        //jwt.verify()
        return next();
    });
}